import sys
import os
import requests
import re
import html
import time
from sqlalchemy import text
from datetime import datetime

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
    
    # Strip all other tags
    html_content = re.sub(r'<[^>]+>', '', html_content)
    
    # Fix entities
    html_content = html.unescape(html_content)
    
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

def backfill_replies():
    db = SessionLocal()
    try:
        print("Fetching interpellations with replies in raw_data...")
        # Get records that have replies in raw_data
        # We process ALL that have replies, to ensure we get the text content even if reply_content is already set with just a URL
        query = text("SELECT id, raw_data, reply_content FROM interpellations WHERE raw_data::text LIKE '%replies%'")
        results = db.execute(query).fetchall()
        
        print(f"Found {len(results)} candidates. Processing...")
        
        count = 0
        updated = 0
        
        for row in results:
            raw = row.raw_data
            if not raw or 'replies' not in raw:
                continue
                
            replies = raw['replies']
            if not replies:
                continue
            
            # Check if we already have substantial content (heuristic: length > 300 might mean we have text, not just a link)
            # User wants us to force fetch content. But we should avoid re-fetching if we clearly have text.
            current_reply = row.reply_content or ""
            if len(current_reply) > 500: 
                # Likely already has content or is a very long link message. 
                # Let's skip to save API calls, unless user forced it. 
                # User complaint implies they DON'T have content.
                pass 
            
            new_reply_text = ""
            fetched_any = False
            
            for reply in replies:
                from_str = reply.get('from', 'Odpowiedź')
                
                # Check for body link
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
                                fetched_any = True
                    except Exception as e:
                        print(f"Failed to fetch {body_url}: {e}")
                
                # Also keep attachment links if 'onlyAttachment' is true or just as backup
                if reply.get('onlyAttachment') and 'attachments' in reply:
                     for att in reply['attachments']:
                         new_reply_text += f"\n[Załącznik: {att['name']}]({att['URL']})\n"

            if fetched_any and len(new_reply_text) > len(current_reply):
                db.execute(
                    text("UPDATE interpellations SET reply_content = :rc WHERE id = :id"),
                    {"rc": new_reply_text.strip(), "id": row.id}
                )
                updated += 1
                
            count += 1
            if count % 10 == 0:
                print(f"Processed {count}/{len(results)} | Updated: {updated}", end='\r')
                db.commit()
                time.sleep(0.1) # Be nice to API
                    
        db.commit()
        print(f"\nFinished! Processed {count}, Updated {updated} records.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    backfill_replies()
