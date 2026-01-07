
import sys
import os
import logging
import time
from sqlalchemy import text
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Interpellation
from backend.utils.http import http_session

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("backfill.content")

from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch_and_update(i_id):
    """
    Fetches content for a single interpellation and updates the DB.
    Uses its own DB session to be thread-safe.
    """
    # Create a new session for this thread
    session = SessionLocal()
    try:
        url = f"https://api.sejm.gov.pl/sejm/term10/interpellations/{i_id}/body"
        resp = http_session.get(url, timeout=20)
        
        content = None
        if resp.status_code == 200:
            content = resp.text
        elif resp.status_code == 404:
            content = "[NO CONTENT]"
        else:
            return f"❌ Error {resp.status_code} for ID {i_id}"
        
        if content:
            session.execute(
                text("UPDATE interpellations SET content = :c WHERE id = :id"),
                {"c": content, "id": i_id}
            )
            session.commit()
            return f"✅ Updated ID {i_id}"
        return f"⚠️ No content for ID {i_id}"
        
    except Exception as e:
        session.rollback()
        return f"❌ Failed ID {i_id}: {e}"
    finally:
        session.close()

def backfill_content(limit=3000):
    session = SessionLocal()
    try:
        # Get IDs needing content (either NULL or placeholder)
        ids = session.query(Interpellation.id).filter(
            (Interpellation.content == None) | 
            (Interpellation.content.like('Treść dostępna%'))
        ).limit(limit).all()
        ids = [i[0] for i in ids]
        
        logger.info(f"🚀 Starting parallel backfill for {len(ids)} interpellations (Workers=5)...")
        
        count = 0
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_id = {executor.submit(fetch_and_update, i_id): i_id for i_id in ids}
            
            for future in as_completed(future_to_id):
                result = future.result()
                # Log only errors or every 50th success to avoid spam
                if "❌" in result:
                    logger.error(result)
                elif count % 50 == 0:
                     logger.info(f"Progress: {count}/{len(ids)} - {result}")
                count += 1
                
        logger.info(f"🏁 Finished batch. Processed {count} records.")
        
    finally:
        session.close()

if __name__ == "__main__":
    backfill_content(limit=5000)
