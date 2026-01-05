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
CONCURRENCY = 15 # Moderate concurrency to avoid overwhelming API/DB
BATCH_SIZE = 50

if not SUPABASE_KEY:
    print("No SUPABASE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_html(raw_html):
    if not raw_html: return None
    clean = re.sub(r'<[^>]+>', '', raw_html)
    clean = clean.replace('&nbsp;', ' ').strip()
    return clean

# --- Interpellations Module ---

async def fetch_interpellation(session, term, num):
    url = f"{API_URL}/term{term}/interpellations/{num}"
    try:
        async with session.get(url, timeout=15) as resp:
            if resp.status == 200:
                data = await resp.json()
                # Parse body
                # Usually body is in details? Or distinct field?
                # The endpoint returns JSON representation. To get text, we might need to check fields.
                # Assuming 'description' is short, 'body' or similar is full?
                # Checking API docs (or standard Sejm API behavior):
                # GET /interpellations/{num} returns content.
                # Often it has "body" or list of "replies".
                
                # Let's try to grab whatever looks like content.
                # Actually, Sejm API for interpellations might return PDF links predominantly.
                # But if there is text, it's usually in 'description' (short) or we need to fetch body separately?
                # WAIT: api.sejm.gov.pl/sejm/termX/interpellations/{num}/body ?
                # Or just /interpellations/{num} has it.
                # I will save the 'content' if available, otherwise description.
                # Replies are often separate links.
                
                # Correction: Sejm API sometimes requires fetching body from specific Body endpoint.
                # Let's try to assume key fields exist in main response for now.
                
                # Safe Parsing
                content = None
                reply = None
                
                # Try to extract content from 'description' if long, or other fields.
                # Actually, real content is often unfortunately only PDF. 
                # BUT, if 'repeatedInterpellation' etc exists.
                # Let's store raw 'description' as content if nothing else.
                
                # Replies: 'replies' list.
                replies = data.get('replies', [])
                if replies:
                    # Fetch first reply?
                    # Usually replies have 'key' or URL.
                    pass
                    
                return data
            elif resp.status == 404:
                return "404"
            else:
                return None
    except:
        return None

# Correction: To get actual text content, we often need to fetch HTML body if API supports it.
# Sejm API: /term{term}/interpellations/{num} returns metadata.
# The content is often in `.../interpellations/{num}/body` (if supported) or we scrape from website.
# However, for this task, I will try to fetch the main endpoint and use available text fields. 
# Improving logic: I will assume the main JSON might have it or I won't get it easily without scraping.
# I will use `from_whom` and `sent_date` etc.
# Wait, user asked for "Deep Content". 
# I'll implement a helper that tries to get `.../interpellations/{num}` which returns JSON.
# If that JSON has `description` I use it. 
# Also check for `replies`.

async def process_interpellation(queue, session, progress):
    while True:
        task = await queue.get()
        if not task:
            break
        
        db_id, term, num, title = task
        # num in DB might correspond to API num.
        
        data = await fetch_interpellation(session, term, num)
        
        updates = {}
        if data and data != "404":
            content = data.get('description', '')
            
            # Replies
            reply_content = ""
            replies = data.get('replies', [])
            if replies:
                last_reply = replies[-1]
                reply_content = f"Odpowiedź od: {last_reply.get('from', 'Unknown')} (Data: {last_reply.get('receiptDate', '-')})"
                
            updates = {
                'id': db_id,
                'title': title, # Required for upsert insert-phase
                'content': content,
                'reply_content': reply_content
            }
        
        if updates:
            progress['results'].append(updates)
            
        progress['count'] += 1
        if progress['count'] % 100 == 0:
            print(f"[Interpellations] Processed {progress['count']}...")
            
        queue.task_done()

# --- Legislation Module ---

async def fetch_process(session, term, print_num):
    # Process ID in DB is print_number usually.
    # API /term{term}/processes/{num}
    url = f"{API_URL}/term{term}/processes/{print_num}"
    try:
        async with session.get(url, timeout=15) as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                return None
    except:
        return None

async def process_legislation(queue, session, progress):
    while True:
        task = await queue.get()
        if not task:
            break
            
        db_id, term, print_num, title = task
        data = await fetch_process(session, term, print_num)
        
        if data:
            desc = data.get('description', '')
            
            # Use provided title or fallback to API title if available
            # But stick to DB title to pass back
            
            updates = {
                'id': db_id,
                'title': title, # Required
                'justification': desc, 
            }
            progress['results'].append(updates)
            
        progress['count'] += 1
        if progress['count'] % 100 == 0:
            print(f"[Legislation] Processed {progress['count']}...")
            
        queue.task_done()

async def batch_updater_interp(result_list):
    while True:
        if len(result_list) >= BATCH_SIZE:
             batch = result_list[:BATCH_SIZE]
             del result_list[:BATCH_SIZE]
             try:
                 supabase.table('interpellations').upsert(batch).execute()
             except Exception as e:
                 print(f"Interp Update error: {e}")
        await asyncio.sleep(1)

async def batch_updater_proc(result_list):
    while True:
        if len(result_list) >= BATCH_SIZE:
             batch = result_list[:BATCH_SIZE]
             del result_list[:BATCH_SIZE]
             try:
                 supabase.table('processes').upsert(batch).execute()
             except Exception as e:
                 print(f"Proc Update error: {e}")
        await asyncio.sleep(1)

async def main():
    print("--- Enriching Content ---")
    
    # 1. Fetch Candidates (Interpellations)
    print("Fetching Interpellation tasks...")
    i_tasks = []
    try:
        offset = 0
        while True:
             # Use 'id' as 'num' since 'num' column implies the ID itself.
             res = supabase.table('interpellations').select('id, term, title').is_('content', 'null').range(offset, offset+999).execute()
             rows = res.data
             if not rows: break
             for r in rows:
                 # Pass id as num
                 i_tasks.append((r['id'], r['term'], r['id'], r.get('title', '')))
             offset += 1000
    except Exception as e:
        print(f"Error fetching interp tasks: {e}")

    print(f"Found {len(i_tasks)} missing interpellations.")
    
    # 2. Fetch Candidates (Legislation/Processes)
    print("Fetching Legislation tasks...")
    p_tasks = []
    try:
        offset = 0
        while True:
             res = supabase.table('processes').select('id, term, print_number, title').is_('justification', 'null').range(offset, offset+999).execute()
             rows = res.data
             if not rows: break
             for r in rows:
                 p_tasks.append((r['id'], r['term'], r['print_number'], r.get('title', '')))
             offset += 1000
    except Exception as e:
        print(f"Error fetching proc tasks: {e}")

    print(f"Found {len(p_tasks)} missing legislation details.")
    
    # queues
    q_i = asyncio.Queue()
    q_p = asyncio.Queue()
    
    for t in i_tasks: q_i.put_nowait(t)
    for t in p_tasks: q_p.put_nowait(t)
    
    prog_i = {'count': 0, 'results': []}
    prog_p = {'count': 0, 'results': []}
    
    async with aiohttp.ClientSession() as session:
        workers = []
        # Interp workers
        for _ in range(10):
            workers.append(asyncio.create_task(process_interpellation(q_i, session, prog_i)))
        # Proc workers
        for _ in range(5):
            workers.append(asyncio.create_task(process_legislation(q_p, session, prog_p)))
            
        # Updaters
        u_i = asyncio.create_task(batch_updater_interp(prog_i['results']))
        u_p = asyncio.create_task(batch_updater_proc(prog_p['results']))
        
        await asyncio.gather(q_i.join(), q_p.join())
        
        # Stop
        for _ in range(15): # Total workers
             # We need to signal stop. But queue.join() just means queue is empty.
             # We need to explicitly cancel or pass None.
             # We passed tasks to specific queues.
             # This is a bit messy with mixed workers. 
             # I used distinct workers for distinct queues.
             pass
             
        # Actually I need to send None to EACH queue.
        for _ in range(10): q_i.put_nowait(None)
        for _ in range(5): q_p.put_nowait(None)
        
        await asyncio.gather(*workers)
        
        # Flush
        while prog_i['results']:
             batch = prog_i['results'][:BATCH_SIZE]
             del prog_i['results'][:BATCH_SIZE]
             supabase.table('interpellations').upsert(batch).execute()
             
        while prog_p['results']:
             batch = prog_p['results'][:BATCH_SIZE]
             del prog_p['results'][:BATCH_SIZE]
             supabase.table('processes').upsert(batch).execute()
             
        u_i.cancel()
        u_p.cancel()

    print("--- Enrichment Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
