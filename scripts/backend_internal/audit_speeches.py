
import sys
import os
import logging
import requests
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))

from backend.core.orm_db import SessionLocal
from backend.models import Speech
from sqlalchemy import func

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audit.speeches")

def audit_speeches():
    session = SessionLocal()
    try:
        # Get counts per sitting for Term 10 in DB
        db_counts = session.query(Speech.sitting, func.count(Speech.id)).filter(Speech.term == 10).group_by(Speech.sitting).all()
        db_map = {s[0]: s[1] for s in db_counts}
        
        # Get sittings from API
        resp = requests.get("https://api.sejm.gov.pl/sejm/term10/proceedings")
        api_sittings = resp.json()
        
        logger.info(f"Checking {len(api_sittings)} sittings...")
        
        for s in api_sittings:
            num = s['number']
            # Fetch transcript list count (metadata only)
            # URL: /proceedings/{num}/transcripts
            
            # Optimization: Try to guess first or fetch?
            # Fetching LIST of transcripts is cheap.
            t_url = f"https://api.sejm.gov.pl/sejm/term10/proceedings/{num}/transcripts"
            t_resp = requests.get(t_url)
            if t_resp.status_code == 200:
                api_count = len(t_resp.json())
                db_c = db_map.get(num, 0)
                
                if api_count != db_c:
                    logger.warning(f"Sitting {num}: API has {api_count}, DB has {db_c}. GAP FOUND.")
                else:
                    logger.info(f"Sitting {num}: OK ({api_count})")
            else:
                logger.error(f"Failed to fetch transcripts for sitting {num}")

    finally:
        session.close()

if __name__ == "__main__":
    audit_speeches()
