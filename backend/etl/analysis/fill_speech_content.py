import asyncio
import aiohttp
import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"
CONCURRENCY = 20 # Conservative start
BATCH_SIZE = 50

if not SUPABASE_KEY:
    print("No SUPABASE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_html(raw_html):
    if not raw_html: return ""
    clean = re.sub(r'<[^>]+>', '', raw_html)
    clean = clean.replace('&nbsp;', ' ').strip()
    return clean

async def fetch_text(session, term, sitting, date, num):
    url = f"{API_URL}/term{term}/proceedings/{sitting}/{date}/transcripts/{num}"
    try:
        async with session.get(url, timeout=10) as resp:
            if resp.status == 200:
                html = await resp.text()
                return clean_html(html)
            elif resp.status == 429:
                await asyncio.sleep(2)
                return await fetch_text(session, term, sitting, date, num)
            return None
    except:
        return None

async def worker(queue, session, progress):
    while True:
        task = await queue.get()
        if not task:
            break
        
        term, sitting, date, num, db_id = task
        content = await fetch_text(session, term, sitting, date, num)
        
        if content and len(content) > 50:
            # We got content. Update DB.
            # We will return it to main for batch update to reduce connection overhead
            progress['results'].append({
                'id': db_id,
                'content': content
            })
        
        progress['count'] += 1
        if progress['count'] % 100 == 0:
            print(f"Processed {progress['count']} items...")
            
        queue.task_done()

async def batch_updater(result_list):
    while True:
        if len(result_list) >= BATCH_SIZE:
             batch = result_list[:BATCH_SIZE]
             del result_list[:BATCH_SIZE]
             
             try:
                 # Supabase upsert specific fields only?
                 # Upsert requires primary key or conflict key.
                 # 'id' is PK.
                 # We update 'content'.
                 supabase.table('speeches').upsert(batch).execute()
             except Exception as e:
                 print(f"Update error: {e}")
        
        await asyncio.sleep(1)

async def main():
    print("--- Deep Content Ingestion: Starting Audit ---")
    
    # 1. Select Empty records
    # We fetch only ID and metadata needed to construct URL
    # Using REST API to fetch ids? Or DB direct?
    # Supabase PY client is easier.
    # We need to page through.
    
    # For now, let's limit to 1000 for demonstration or fetch all?
    # User said "Deep Ingestion", implied all.
    # But 71k records...
    # Fetching 71k IDs is fast.
    
    print("Fetching empty speech list...")
    # We can use postgrest filter `length(content) < 50`?
    # Actually PostgREST doesn't support length() in filter easily (need computed column).
    # We can just check `content=eq.` (empty string) since we saw they were empty.
    
    all_tasks = []
    
    # Paging logic
    offset = 0
    while True:
        res = supabase.table('speeches').select('id, term, sitting, date, statement_num, content').eq('content', '').range(offset, offset+999).execute()
        rows = res.data
        if not rows:
            break
        
        for r in rows:
            all_tasks.append((r['term'], r['sitting'], r['date'], r['statement_num'], r['id']))
            
        offset += 1000
        print(f"Fetched {len(all_tasks)} targets...")
        if len(rows) < 1000:
            break
            
    print(f"Found {len(all_tasks)} empty speeches.")
    
    if not all_tasks:
        return

    progress = {'count': 0, 'results': []}
    queue = asyncio.Queue()
    
    # Enqueue
    for t in all_tasks:
        queue.put_nowait(t)
        
    async with aiohttp.ClientSession() as session:
        workers = [asyncio.create_task(worker(queue, session, progress)) for _ in range(CONCURRENCY)]
        updater = asyncio.create_task(batch_updater(progress['results']))
        
        await queue.join()
        
        # Stop workers
        for _ in range(CONCURRENCY):
            queue.put_nowait(None)
        await asyncio.gather(*workers)
        
        # Flush remaining updates
        while progress['results']:
            # Force flush
            batch = progress['results'][:BATCH_SIZE]
            del progress['results'][:BATCH_SIZE]
            supabase.table('speeches').upsert(batch).execute()
            
        updater.cancel()
        
    print("--- Ingestion Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
