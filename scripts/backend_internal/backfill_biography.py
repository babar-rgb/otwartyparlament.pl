import sys
import os
import requests
import time
import json
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add project root path
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))

from backend.core.orm_db import SessionLocal
from backend import models

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def backfill():
    print("Starting MP Biography Backfill...")
    db = SessionLocal()
    try:
        mps = db.query(models.MP).filter(models.MP.term == 10).all()
        print(f"Found {len(mps)} MPs to update.")
        
        for i, mp in enumerate(mps):
            try:
                print(f"[{i+1}/{len(mps)}] Fetching data for {mp.first_name} {mp.last_name} (ID: {mp.id})")
                r = requests.get(f"{SEJM_API_URL}/MP/{mp.id}", timeout=10)
                if r.status_code == 200:
                    data = r.json()
                    
                    # Update fields
                    mp.birth_date = data.get('birthDate')
                    mp.birth_location = data.get('birthLocation')
                    mp.profession = data.get('profession')
                    mp.education_level = data.get('educationLevel')
                    mp.education_history = data.get('educations', []) # SQLA JSONB handles list/dict directly
                    
                    # Also update contact info if available (bonus)
                    # We might need to merge it? Simplify: just rely on existing incremental logic for that?
                    # Let's focus on bio.
                    
                    # Commit every 10 or so? Or individually.
                    # Individually is safer for script restartability if it crashes.
                    db.commit()
                else:
                    print(f"Error {r.status_code} for MP {mp.id}")
                
            except Exception as e:
                print(f"Error processing MP {mp.id}: {e}")
                
            # Be polite
            # time.sleep(0.1) 
            
        print("Backfill complete.")
        
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
