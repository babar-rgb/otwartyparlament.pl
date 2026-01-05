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
                    try:
                        num = item['num']
                        body_url = f"{SEJM_API_URL}/interpellations/{num}/body"
                        r_body = requests.get(body_url)
                        if r_body.status_code == 200:
                            content = r_body.text
                    except Exception as e:
                        print(f"  Error fetching body for {item['num']}: {e}")

                    # Prepare Data
                    interp_data = {
                        "id": item['num'],
                        "title": item['title'],
                        "sent_date": item.get('sentDate'),
                        "last_modified": item.get('lastModified'),
                        "raw_data": item
                    }
                    if content:
                        interp_data['raw_data']['content'] = content
                    
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

if __name__ == "__main__":
    import_interpellations()
