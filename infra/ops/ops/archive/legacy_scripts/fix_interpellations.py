import asyncio
import aiohttp
import os
import re
from aiohttp_retry import RetryClient, ExponentialRetry
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"
CONCURRENCY = 5
BATCH_SIZE = 10 

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_html(raw_html):
    if not raw_html: return ""
    clean = re.sub(r'<[^>]+>', '', raw_html)
    clean = clean.replace('&nbsp;', ' ').strip()
    return clean

async def fetch_text_from_link(session, url):
    try:
        async with session.get(url, timeout=10) as resp:
            if resp.status == 200:
                html = await resp.text()
                return clean_html(html)
    except:
        pass
    return ""

async def process_interpellation(queue, session, progress):
    while True:
        task = await queue.get()
        if not task:
            break
        
        db_id, term, num = task # num is id here
        
        meta_url = f"{API_URL}/term{term}/interpellations/{num}"
        # print(f"Processing {num}...") # Verbose
        
        content = ""
        reply_content = ""
        
        try:
            async with session.get(meta_url, timeout=10) as resp:
                if resp.status != 200:
                    print(f"Failed metadata {num}: {resp.status}")
                
                if resp.status == 200:
                    data = await resp.json()
                    
                    # 1. Fetch Question Body
                    links = data.get('links', [])
                    body_url = next((l['href'] for l in links if l.get('rel') == 'body'), None)
                    
                    if body_url:
                        content = await fetch_text_from_link(session, body_url)
                        
                    if not content or len(content) < 10:
                        # Fallback to PDF
                        # Sejm API: attachments available in data? usually yes.
                        # Wait, Step 3253 didn't show attachments for main interp?
                        # It showed "links": ... "web-description" ...
                        # It didn't show "attachments" key in root.
                        # But replies had it.
                        # Check documentation: /term/interpellations/{id}
                        # It usually has attachments if scanned.
                        # I'll check 'attachments' key.
                        
                        atts = data.get('attachments', [])
                        if atts:
                            pdf_url = atts[0].get('URL')
                            content = f"Treść dostępna w załączniku PDF: {pdf_url}"
                        else:
                            # Maybe link to web description
                            web_link = next((l['href'] for l in links if l.get('rel') == 'web-description'), None)
                            if web_link:
                                content = f"Treść dostępna na stronie Sejmu: {web_link}"
                            else:
                                content = "Brak treści cyfrowej."

                    # 2. Fetch Replies Body
                    replies = data.get('replies', [])
                    reply_texts = []
                    
                    for reply in replies:
                        r_links = reply.get('links', [])
                        r_body_url = next((l['href'] for l in r_links if l.get('rel') == 'body'), None)
                        r_from = reply.get('from', 'Nieznany')
                        r_date = reply.get('receiptDate', '?')
                        
                        r_text = ""
                        if r_body_url:
                            r_text = await fetch_text_from_link(session, r_body_url)
                        
                        if not r_text:
                            # Fallback
                             r_atts = reply.get('attachments', [])
                             if r_atts:
                                 r_pdf = r_atts[0].get('URL')
                                 r_text = f"Odpowiedź w załączniku PDF: {r_pdf}"
                        
                        if r_text:
                            reply_texts.append(f"--- Odpowiedź od: {r_from} ({r_date}) ---\n{r_text}")
                            
                    if reply_texts:
                        reply_content = "\n\n".join(reply_texts)
                        
        except Exception as e:
            # print(f"Error fetching {num}: {e}")
            pass
            
        # Update if we got anything
        if len(content) > 10 or len(reply_content) > 10:
            updates = {
                'id': db_id,
                'content': content,
                'reply_content': reply_content,
                # We should retrieve title from DB to satisfy upsert constraint?
                # Actually, Interpellations 'title' IS NOT NULL.
                # If we do partial update, we MUST pass title if upsert tries insert?
                # BUT we are updating EXISTING rows.
                # With Supabase/Postgrest, if we include ID, it should update.
                # But earlier failure suggested we needed title. 
                # I will try to use `rpc` or just fetch title in candidate list.
                # Or just use `update` method on ID, but that's slow (N requests).
                # BETTER: Include 'title' in the task.
            }
            if len(task) > 3: # If title is in task
                updates['title'] = task[3]
                progress['results'].append(updates)
        
        progress['count'] += 1
        if progress['count'] % 50 == 0:
            print(f"[Interp] Processed {progress['count']}...")
            
        queue.task_done()

async def batch_updater(result_list):
    while True:
        if len(result_list) >= BATCH_SIZE:
             batch = result_list[:BATCH_SIZE]
             del result_list[:BATCH_SIZE]
             try:
                 supabase.table('interpellations').upsert(batch).execute()
             except Exception as e:
                 print(f"Upsert error (Interp): {e}")
        await asyncio.sleep(1)

async def main():
    print("--- Fixing Interpellations (Double-Hop Fetching) ---")
    
    tasks = []
    # Fetch candidates: content length < 20 (empty or short placeholder)
    # Using 'interpellations' table.
    # Logic: SELECT id, term, title FROM interpellations WHERE length(content) < 20;
    # Supabase filter? `content=lt.20` doesn't work on length.
    # But I know I filled them with empty strings. So `content` eq ''?
    # Or just fetch all and verify locally (expensive).
    # Re-using logic: `content` is likely empty string or NULL.
    # My previous script filled with `description` which was likely missing, so empty string.
    
    print("Fetching task list...")
    # Page through
    offset = 0
    try:
        while True:
             # Fetch where content is NULL or empty string
             # Or loop all... 14k is fast to loop IDs.
             res = supabase.table('interpellations').select('id, term, title, content').range(offset, offset+999).execute()
             rows = res.data
             if not rows: break
             
             for r in rows:
                 c = r.get('content')
                 if not c or len(c) < 50:
                     tasks.append((r['id'], r['term'], r['id'], r.get('title', '')))
             
             offset += 1000
             if len(rows) < 1000: break
    except Exception as e:
        print(f"Scan error: {e}")
        return

    print(f"Found {len(tasks)} empty interpellations to fix.")
    
    if not tasks: return

    queue = asyncio.Queue()
    for t in tasks: queue.put_nowait(t)
    
    prog = {'count': 0, 'results': []}
    
    retry_options = ExponentialRetry(attempts=3)
    async with RetryClient(retry_options=retry_options) as session:
        workers = [asyncio.create_task(process_interpellation(queue, session, prog)) for _ in range(CONCURRENCY)]
        updater = asyncio.create_task(batch_updater(prog['results']))
        
        await queue.join()
        
        for _ in range(CONCURRENCY): queue.put_nowait(None)
        await asyncio.gather(*workers)
        
        while prog['results']:
            batch = prog['results'][:BATCH_SIZE]
            del prog['results'][:BATCH_SIZE]
            supabase.table('interpellations').upsert(batch).execute()
            
        updater.cancel()

    print("--- Interpellations Fix Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
