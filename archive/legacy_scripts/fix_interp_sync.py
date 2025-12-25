#!/usr/bin/env python3
import requests
import os
import re
from supabase import create_client
from dotenv import load_dotenv
import time

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_html(raw_html):
    if not raw_html: return ""
    clean = re.sub(r'<[^>]+>', '', raw_html)
    return clean.replace('&nbsp;', ' ').strip()

def process_one(db_id, term, title):
    """Process a single interpellation"""
    try:
        meta_url = f"{API_URL}/term{term}/interpellations/{db_id}"
        resp = requests.get(meta_url, timeout=10)
        
        if resp.status_code != 200:
            return None
            
        data = resp.json()
        links = data.get('links', [])
        replies = data.get('replies', [])
        
        # Try to get body text
        content = ""
        body_url = next((l['href'] for l in links if l.get('rel') == 'body'), None)
        
        if body_url:
            try:
                r2 = requests.get(body_url, timeout=10, headers={"Accept": "text/html"})
                if r2.status_code == 200:
                    content = clean_html(r2.text)
            except:
                pass
        
        # Fallback to PDF link
        if not content or len(content) < 10:
            atts = data.get('attachments', [])
            if atts:
                pdf_url = atts[0].get('URL')
                content = f"Treść dostępna w załączniku PDF: {pdf_url}"
            else:
                web_link = next((l['href'] for l in links if l.get('rel') == 'web-description'), None)
                if web_link:
                    content = f"Treść dostępna na stronie Sejmu: {web_link}"
                else:
                    content = data.get('title', 'Brak treści')
        
        # Get replies
        reply_content = ""
        reply_texts = []
        
        for reply in replies[:2]:  # Limit to 2 replies to avoid timeout
            r_from = reply.get('from', 'Nieznany')
            r_date = reply.get('receiptDate', '?')
            r_text = ""
            
            r_links = reply.get('links', [])
            r_url = next((l['href'] for l in r_links if l.get('rel') == 'body'), None)
            
            if r_url:
                try:
                    r3 = requests.get(r_url, timeout=10)
                    if r3.status_code == 200:
                        r_text = clean_html(r3.text)
                except:
                    pass
            
            if not r_text:
                r_atts = reply.get('attachments', [])
                if r_atts:
                    r_pdf = r_atts[0].get('URL')
                    r_text = f"Odpowiedź w PDF: {r_pdf}"
            
            if r_text:
                reply_texts.append(f"--- {r_from} ({r_date}) ---\n{r_text}")
        
        if reply_texts:
            reply_content = "\n\n".join(reply_texts)
        
        return {
            'id': db_id,
            'title': title,
            'content': content,
            'reply_content': reply_content
        }
        
    except Exception as e:
        print(f"Error {db_id}: {e}")
        return None

def main():
    print("=== Synchronous Interpellations Fix ===")
    
    # Fetch targets
    print("Loading candidates...")
    offset = 0
    tasks = []
    
    while True:
        res = supabase.table('interpellations').select('id, term, title, content').range(offset, offset+999).execute()
        rows = res.data
        if not rows: break
        
        for r in rows:
            c = r.get('content')
            if not c or len(c) < 50:
                tasks.append((r['id'], r['term'], r.get('title', '')))
        
        offset += 1000
        if len(rows) < 1000: break
    
    print(f"Found {len(tasks)} to fix")
    
    if not tasks:
        print("Nothing to do!")
        return
    
    # Process in batches
    batch = []
    processed = 0
    
    for db_id, term, title in tasks:
        result = process_one(db_id, term, title)
        
        if result:
            batch.append(result)
        
        processed += 1
        
        # Batch update every 10
        if len(batch) >= 10:
            try:
                supabase.table('interpellations').upsert(batch).execute()
                print(f"✓ {processed}/{len(tasks)} (batch saved)")
                batch = []
            except Exception as e:
                print(f"Batch error: {e}")
                batch = []
        
        # Rate limit
        if processed % 50 == 0:
            print(f"Progress: {processed}/{len(tasks)}")
            time.sleep(1)
    
    # Final flush
    if batch:
        try:
            supabase.table('interpellations').upsert(batch).execute()
            print(f"✓ Final batch saved")
        except Exception as e:
            print(f"Final error: {e}")
    
    print(f"=== Complete: {processed} processed ===")

if __name__ == "__main__":
    main()
