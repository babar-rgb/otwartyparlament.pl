
import sys
import os
import logging
import time
from sqlalchemy import text
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Speech
from backend.utils.http import http_session

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("backfill.speeches")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm"

def backfill_speeches(limit=1000):
    session = SessionLocal()
    try:
        # Find empty speeches
        speeches = session.query(Speech).filter(
            (Speech.content == None) | (Speech.content == '')
        ).limit(limit).all()
        
        logger.info(f"Found {len(speeches)} empty speeches.")
        
        count = 0
        for s in speeches:
            try:
                # Construct URL
                # Endpoint: /term{term}/proceedings/{sitting}/transcripts/{num}
                # But 'num' inside transcript object is 'num'. The URL param might be 'num' too.
                # Usually: /term10/proceedings/1/transcripts/1
                
                term = s.term if s.term else 10 # Default to 10 if missing
                url = f"{SEJM_API_URL}/term{term}/proceedings/{s.sitting}/transcripts/{s.statement_num}"
                
                resp = http_session.get(url, timeout=30)
                
                if resp.status_code == 200:
                    data = resp.json()
                    # Content is usually in 'text' field? Or the whole object?
                    # API returns JSON object with 'text' field usually.
                    # Let's assume 'text' field.
                    content = data.get('text')
                    
                    if content:
                        s.content = content
                        session.commit()
                        count += 1
                        logger.info(f"Updated Speech {s.id}")
                    else:
                        logger.warning(f"No text in response for Speech {s.id}")
                        
                elif resp.status_code == 404:
                    logger.warning(f"Speech {s.id} (Term {term}, Sit {s.sitting}, Num {s.statement_num}) not found in API.")
                    # Maybe mark as deleted?
                else:
                    logger.warning(f"Error {resp.status_code} for Speech {s.id}")
                
                time.sleep(1.0)
            except Exception as e:
                logger.error(f"Failed Speech {s.id}: {e}")
                session.rollback()
                
        logger.info(f"Finished backfill. Updated {count} speeches.")
        
    finally:
        session.close()

if __name__ == "__main__":
    backfill_speeches()
