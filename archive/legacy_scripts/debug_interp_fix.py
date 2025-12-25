import requests
import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or "http://localhost:5173"
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
API_URL = "https://api.sejm.gov.pl/sejm"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_html(raw_html):
    if not raw_html: return ""
    clean = re.sub(r'<[^>]+>', '', raw_html)
    clean = clean.replace('&nbsp;', ' ').strip()
    return clean

def main():
    print("--- Debug Interpellation Fix (Sync) ---")
    
    # 1. Fetch Candidate
    db_id = 99 # ID 99 or 100
    term = 10
    
    print(f"Fixing ID {db_id} (Term {term})...")
    
    # 2. Fetch Meta
    meta_url = f"{API_URL}/term{term}/interpellations/{db_id}"
    resp = requests.get(meta_url)
    if resp.status_code != 200:
        print(f"Meta Error: {resp.status_code}")
        return
        
    data = resp.json()
    replies = data.get('replies', [])
    links = data.get('links', [])
    body_url = next((l['href'] for l in links if l.get('rel') == 'body'), None)
    
    content = ""
    if body_url:
        print(f"Fetch {body_url}...")
        r2 = requests.get(body_url, headers={"Accept": "text/html"})
        print(f"Status: {r2.status_code}")
        print(f"Headers: {r2.headers}")
        print(f"Raw: {r2.text[:100]}")
        if r2.status_code == 200:
            content = clean_html(r2.text)
            print(f"Content Length: {len(content)}")
    
    # Replies
    for reply in replies:
        r_links = reply.get('links', [])
        r_url = next((l['href'] for l in r_links if l.get('rel') == 'body'), None)
        if r_url:
             print(f"Fetch Reply {r_url}")
             r3 = requests.get(r_url)
             print(f"R Status: {r3.status_code}")
             if r3.status_code == 200:
                 reply_content += clean_html(r3.text) + "\n\n"
                 
    print(f"Reply Len: {len(reply_content)}")
    
    # Update DB
    if content or reply_content:
        res = supabase.table('interpellations').update({'content': content, 'reply_content': reply_content}).eq('id', db_id).execute()
        print("DB Update Result:", res)
    else:
        print("Nothing to update.")

if __name__ == "__main__":
    main()
