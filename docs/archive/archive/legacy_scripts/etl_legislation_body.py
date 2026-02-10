import asyncio
import aiohttp
import os
import re
from bs4 import BeautifulSoup
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Config
SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"
CONCURRENCY = 10
BATCH_SIZE = 25

if not SUPABASE_KEY:
    print("No SUPABASE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_html_bs4(raw_html):
    if not raw_html: return ""
    soup = BeautifulSoup(raw_html, 'html.parser')
    # Improve readability by adding newlines for block elements
    for br in soup.find_all("br"):
        br.replace_with("\n")
    for p in soup.find_all("p"):
        p.append("\n")
    return soup.get_text().strip()

async def fetch_print_details(session, term, print_num):
    url = f"{API_URL}/term{term}/prints/{print_num}"
    try:
        async with session.get(url, timeout=15) as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                return None
    except:
        return None

async def fetch_html_content(session, url):
    try:
        async with session.get(url, timeout=20) as resp:
            if resp.status == 200:
                return await resp.text()
    except:
        pass
    return None

async def process_item(queue, session, progress):
    while True:
        task = await queue.get()
        if not task:
            break
            
        db_id, term, print_num, title = task
        
        # 1. Fetch Print Metadata
        print_data = await fetch_print_details(session, term, print_num)
        
        body_text = None
        source_url = None
        justification_update = None
        
        if print_data:
            # 2. Look for attachments
            attachments = print_data.get('attachments', [])
            html_url = None
            pdf_url = None
            
            # Helper to get name/url
            processed_atts = []
            for att in attachments:
                if isinstance(att, str):
                    # It's a filename. URL is constructible.
                    # Note: API might encode filename? Usually it's safe.
                    u = f"{API_URL}/term{term}/prints/{print_num}/{att}"
                    processed_atts.append({'name': att, 'url': u})
                else:
                    processed_atts.append({'name': att.get('fileName'), 'url': att.get('url')})
            
            # Prefer HTML
            for att in processed_atts:
                name = att['name'].lower()
                if name.endswith('.html') or name.endswith('.htm'):
                     html_url = att['url']
                     break
                if name.endswith('.pdf') and not pdf_url:
                     pdf_url = att['url']
            
            if html_url:
                 raw_html = await fetch_html_content(session, html_url)
                 if raw_html:
                     body_text = clean_html_bs4(raw_html)
                     source_url = html_url
            
            # Fallback to PDF ref
            if not body_text:
                doc_desc = print_data.get('documentDescription', '')
                base_text = doc_desc if doc_desc else "Brak opisu tekstowego."
                
                if pdf_url:
                    body_text = f"{base_text}\n\n[Dokument dostępny jako PDF: {pdf_url}]"
                    source_url = pdf_url
                else:
                    body_text = f"{base_text}"
                    
        # Update payload
        if body_text or source_url:
            updates = {
                'id': db_id,
                'title': title, 
                'body_text': body_text,
                'source_url': source_url
            }
            progress['results'].append(updates)
            
        progress['count'] += 1
        if progress['count'] % 50 == 0:
            print(f"Processed {progress['count']} bills...")
            
        queue.task_done()

async def batch_updater(result_list):
    while True:
        if len(result_list) >= BATCH_SIZE:
             batch = result_list[:BATCH_SIZE]
             del result_list[:BATCH_SIZE]
             try:
                 supabase.table('processes').upsert(batch).execute()
             except Exception as e:
                 print(f"Upsert error: {e}")
        await asyncio.sleep(1)

async def main():
    print("--- Deep Legislation Ingestion (Body Text) ---")
    
    # 1. Fetch Candidates
    # `processes` where `body_text` IS NULL
    tasks = []
    print("Fetching candidates...")
    try:
        offset = 0
        while True:
             res = supabase.table('processes').select('id, term, print_number, title').is_('body_text', 'null').range(offset, offset+999).execute()
             rows = res.data
             if not rows: break
             for r in rows:
                 if r.get('print_number'):
                     tasks.append((r['id'], r['term'], r['print_number'], r.get('title', '')))
             offset += 1000
    except Exception as e:
        print(f"Error fetching candidates: {e}")
        return

    print(f"Found {len(tasks)} bills to process.")
    
    if not tasks:
        return

    # Queue
    queue = asyncio.Queue()
    for t in tasks:
        queue.put_nowait(t)
        
    progress = {'count': 0, 'results': []}
    
    async with aiohttp.ClientSession() as session:
        workers = [asyncio.create_task(process_item(queue, session, progress)) for _ in range(CONCURRENCY)]
        updater = asyncio.create_task(batch_updater(progress['results']))
        
        await queue.join()
        
        for _ in range(CONCURRENCY):
            queue.put_nowait(None)
        await asyncio.gather(*workers)
        
        # Flush
        while progress['results']:
            batch = progress['results'][:BATCH_SIZE]
            del progress['results'][:BATCH_SIZE]
            supabase.table('processes').upsert(batch).execute()
        
        updater.cancel()
        
    print("--- Legislation Ingestion Complete ---")

if __name__ == "__main__":
    asyncio.run(main())
