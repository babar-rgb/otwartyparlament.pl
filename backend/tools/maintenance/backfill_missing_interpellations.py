
import sys
import os
import logging
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import MP, InterpellationAuthor
from backend.etl.interpellations import InterpellationsETL

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill.interpellations")

def backfill_missing():
    session = SessionLocal()
    try:
        # Find MPs with NO interpellations in Term 10
        active_mps = session.query(MP).filter(MP.term == 10, MP.active == True).all()
        
        missing_mp_ids = []
        for mp in active_mps:
            count = session.query(InterpellationAuthor).filter(InterpellationAuthor.mp_id == mp.id).count()
            if count == 0:
                missing_mp_ids.append(mp.id)
                
        logger.info(f"Found {len(missing_mp_ids)} MPs with zero interpellations: {missing_mp_ids}")
        
        # InterpellationsETL by default scans ALL pages. 
        # API doesn't seem to support filtering by MP in list?
        # Checking backend/etl/interpellations.py -> url = .../interpellations?limit=50
        # Sejm API docs: /interpellations?from={mp_id} is possible!
        
        from backend.etl.interpellations import InterpellationsETL
        from backend.utils.http import http_session
        
        etl = InterpellationsETL()
        
        for mp_id in missing_mp_ids:
            logger.info(f"Fetching interpellations specifically for MP {mp_id}...")
            url = f"https://api.sejm.gov.pl/sejm/term10/interpellations?from={mp_id}"
            try:
                resp = http_session.get(url, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    logger.info(f"MP {mp_id}: Found {len(data)} items.")
                    if data:
                        etl._process_batch(data)
                else:
                    logger.error(f"Failed to fetch for MP {mp_id}: {resp.status_code}")
            except Exception as e:
                logger.error(f"Error fetching for MP {mp_id}: {e}")
                
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    backfill_missing()
