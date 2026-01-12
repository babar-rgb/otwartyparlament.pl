import sys
import os
import requests
import re
import html
from sqlalchemy import text

# Path setup
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.orm_db import SessionLocal
from backend import models

def clean_html(html_content):
    if not html_content:
        return None
    # 1. Extract body content if present
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL | re.IGNORECASE)
    if body_match:
        html_content = body_match.group(1)
    # 2. Remove script and style
    html_content = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    # 3. Structure preservation
    html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</p>', '\n\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<[^>]+>', '', html_content)
    html_content = html.unescape(html_content)
    
    # 4. Remove redundant headers (specific to replies)
    html_content = re.sub(r'Odpowiedź na interpelację nr \d+', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'w sprawie .*?(\n|$)', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'Odpowiadający: .*?(\n|$)', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'Warszawa, \d+-\d+-\d+', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'Warszawa, dnia .*?(\n|$)', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'Treść odpowiedzi znajduje się w załączniku\.', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'Załączniki', '', html_content, flags=re.IGNORECASE)
    
    # Fix excess whitespace
    html_content = re.sub(r'(\s*\n\s*){3,}', '\n\n', html_content)
    html_content = re.sub(r'\n\s*\n', '\n\n', html_content)
    
    # Capitalize paragraph starts
    paragraphs = html_content.split('\n\n')
    fixed_paragraphs = []
    for p in paragraphs:
        p = p.strip()
        if not p: continue
        if p and p[0].islower():
            p = p[0].upper() + p[1:]
        fixed_paragraphs.append(p)
    return '\n\n'.join(fixed_paragraphs)

def fetch_single_reply(interp_id):
    db = SessionLocal()
    try:
        print(f"Fetching reply for {interp_id}...")
        query = text("SELECT id, raw_data FROM interpellations WHERE id = :id")
        row = db.execute(query, {"id": interp_id}).fetchone()
        
        if not row:
            print("Not found.")
            return

        raw = row.raw_data
        if not raw or 'replies' not in raw:
            print("No replies in metadata.")
            return
            
        new_reply_text = ""
        for reply in raw['replies']:
            from_str = reply.get('from', 'Odpowiedź')
            body_url = None
            if 'links' in reply:
                for link in reply['links']:
                    if link.get('rel') == 'body':
                        body_url = link['href']
                        break
                        
            if body_url:
                try:
                    resp = requests.get(body_url, timeout=5)
                    if resp.status_code == 200:
                        cleaned = clean_html(resp.text)
                        if cleaned:
                            sent_date = reply.get('receiptDate', '')
                            header = f"--- {from_str} ({sent_date}) ---"
                            new_reply_text += f"{header}\n\n{cleaned}\n\n"
                            print(f"Fetched reply from {from_str} ({len(cleaned)} chars)")
                except Exception as e:
                    print(f"Error fetching {body_url}: {e}")
                    
             # Also keep attachment links
            if reply.get('onlyAttachment') and 'attachments' in reply:
                 for att in reply['attachments']:
                     new_reply_text += f"\n[Załącznik: {att['name']}]({att['URL']})\n"

        if new_reply_text:
            db.execute(
                text("UPDATE interpellations SET reply_content = :rc WHERE id = :id"),
                {"rc": new_reply_text.strip(), "id": interp_id}
            )
            db.commit()
            print("Database updated.")
        else:
            print("No content fetched.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        fetch_single_reply(int(sys.argv[1]))
    else:
        print("Provide ID")
