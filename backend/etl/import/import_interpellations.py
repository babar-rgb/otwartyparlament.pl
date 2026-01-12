import os
import sys
import requests
import time
from sqlalchemy.orm import Session
from datetime import datetime

# Add project root to python path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend import models

# --- CONFIGURATION ---
SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def upsert_interpellation(db: Session, data: dict):
    """
    Upsert interpellation data.
    """
    interp_id = data['id']
    interp = db.query(models.Interpellation).filter(models.Interpellation.id == interp_id).first()
    
    if not interp:
        interp = models.Interpellation(id=interp_id)
        db.add(interp)
    
    # Update fields
    interp.title = data['title']
    if data.get('sent_date'):
        interp.sent_date = data['sent_date']
    if data.get('last_modified'):
         # Convert string to datetime if needed, API usually returns YYYY-MM-DD or ISO
         pass # SQLA deals with dates often if string format matches, but let's be safe if needed. 
         # Assuming API returns ISO strings or similar that Postgres accepts.
    
    interp.raw_data = data['raw_data']
    # status? API doesn't always provide simple status field here, but let's assume raw_data has it
    
    # Commit to get ID (though we set it manually)
    db.commit()
    return interp

def upsert_author(db: Session, interpellation_id: int, mp_id: int):
    """
    Link MP to Interpellation.
    """
    # Check if exists
    link = db.query(models.InterpellationAuthor).filter(
        models.InterpellationAuthor.interpellation_id == interpellation_id,
        models.InterpellationAuthor.mp_id == mp_id
    ).first()
    
    if not link:
        link = models.InterpellationAuthor(interpellation_id=interpellation_id, mp_id=mp_id)
        db.add(link)
        db.commit()

def import_interpellations():
    print("Starting Interpellations Import (SQLAlchemy)...")
    
    db = SessionLocal()
    
    try:
        offset = 0
        limit = 10 
        total_imported = 0
        
        while True:
            url = f"{SEJM_API_URL}/interpellations?limit={limit}&offset={offset}"
            print(f"Fetching: {url}")
            
            try:
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                
                if not data:
                    break
                    
                for item in data:
                    # Fetch body
                    content = None
                    reply_content = None

                    try:
                        num = item['num']
                        # Fetch Main Content
                        body_url = f"{SEJM_API_URL}/interpellations/{num}/body"
                        r_body = requests.get(body_url)
                        if r_body.status_code == 200:
                            content = clean_html(r_body.text)
                        
                        # Fetch Reply Content
                        if 'replies' in item:
                            for reply in item['replies']:
                                if 'links' in reply:
                                    for link in reply['links']:
                                        if link.get('rel') == 'body':
                                            r_reply = requests.get(link['href'])
                                            if r_reply.status_code == 200:
                                                cleaned_reply = clean_html(r_reply.text)
                                                if reply_content:
                                                    reply_content += "\n\n--- ODPOWIEDŹ ---\n\n" + cleaned_reply
                                                else:
                                                    reply_content = cleaned_reply
                    except Exception as e:
                        print(f"  Error fetching body/reply for {item['num']}: {e}")

                    # Prepare Data
                    interp_data = {
                        "id": item['num'],
                        "title": item['title'],
                        "sent_date": item.get('sentDate'),
                        "last_modified": item.get('lastModified'),
                        "raw_data": item
                    }
                    if content:
                        interp_data['content'] = content
                    if reply_content:
                        interp_data['reply_content'] = reply_content
                    
                    # 1. Upsert Interpellation
                    upsert_interpellation(db, interp_data)
                    
                    # 2. Upsert Authors
                    if 'from' in item:
                        for mp_id_str in item['from']:
                            try:
                                mp_id = int(mp_id_str)
                                upsert_author(db, item['num'], mp_id)
                            except ValueError:
                                pass
                
                count = len(data)
                total_imported += count
                print(f"Imported batch {offset}-{offset+count}")
                
                offset += limit
                time.sleep(0.2)
                
            except Exception as e:
                print(f"Error fetching/saving batch at offset {offset}: {e}")
                db.rollback()
                break
                
        print(f"Finished. Total imported: {total_imported}")
        
    finally:
        db.close()

def clean_html(html_content):
    if not html_content:
        return None
    import re
    # Remove DOCTYPE, html, head, body tags but keep content
    # Simple regex approach to strip tags but keep paragraphs Structure if needed
    # Ideally we'd use BeautifulSoup but avoiding extra deps if possible
    
    # 1. Extract body content if present
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html_content, re.DOTALL | re.IGNORECASE)
    if body_match:
        html_content = body_match.group(1)
        
    # 2. Remove script and style
    html_content = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
    
    # 3. Simple tag stripping (but keeping p/br for structure?) 
    # For now, let's keep it simple: strip all tags and fixing whitespace
    # OR: keep <p> and <br> for display? User complained about "weird format". 
    # Let's try to keep text only but organized.
    
    # Replace <p>, <br> with newlines
    html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</p>', '\n\n', html_content, flags=re.IGNORECASE)
    
    # Strip all other tags
    html_content = re.sub(r'<[^>]+>', '', html_content)
    
    # Fix entities
    import html
    html_content = html.unescape(html_content)
    
    # Fix excess whitespace
    lines = [line.strip() for line in html_content.split('\n')]
    clean_text = '\n'.join(line for line in lines if line)
    
    return clean_text

if __name__ == "__main__":
    import_interpellations()
