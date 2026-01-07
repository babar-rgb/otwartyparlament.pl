
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

def backfill_content(limit=1000):
    session = SessionLocal()
    try:
        # Get IDs needing content (either NULL or placeholder)
        ids = session.query(Interpellation.id).filter(
            (Interpellation.content == None) | 
            (Interpellation.content.like('Treść dostępna%'))
        ).limit(limit).all()
        ids = [i[0] for i in ids]
        
        logger.info(f"Checking {len(ids)} interpellations for missing content...")
        
        count = 0
        for i_id in ids:
            try:
                url = f"https://api.sejm.gov.pl/sejm/term10/interpellations/{i_id}/body"
                resp = http_session.get(url, timeout=30)
                
                content = None
                if resp.status_code == 200:
                    content = resp.text
                elif resp.status_code == 404:
                    content = "[NO CONTENT]" # Mark as empty to avoid refetch
                else:
                    logger.warning(f"Error {resp.status_code} for ID {i_id}")
                    continue
                
                if content:
                    session.execute(
                        text("UPDATE interpellations SET content = :c WHERE id = :id"),
                        {"c": content, "id": i_id}
                    )
                    session.commit()
                    count += 1
                    if count % 10 == 0:
                        logger.info(f"Processed {count}/{len(ids)}")
                
                # Rate limit
                time.sleep(1.0) 
                
            except Exception as e:
                logger.error(f"Failed ID {i_id}: {e}")
                session.rollback()
                
        logger.info(f"Finished batch. Updated {count} records.")
        
    finally:
        session.close()

if __name__ == "__main__":
    backfill_content(limit=5000)
