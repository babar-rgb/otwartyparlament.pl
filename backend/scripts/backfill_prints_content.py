
import sys
import os
import logging
import time
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import SejmPrint
from backend.utils.http import http_session

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("backfill.prints")

def backfill_prints():
    session = SessionLocal()
    try:
        # Check prints. 
        # Ideally we should filtered by missing content, but for now we iterate to check attachments.
        # Limit to recent ones or iterate all.
        prints = session.query(SejmPrint).order_by(SejmPrint.number.desc()).all()
        logger.info(f"Checking {len(prints)} prints for justification attachments...")
        
        count = 0
        for p in prints:
            url = f"https://api.sejm.gov.pl/sejm/term10/prints/{p.number}"
            try:
                resp = http_session.get(url, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    attachments = data.get('attachments', [])
                    
                    found_justification = False
                    for att in attachments:
                        # DEBUG
                        # logger.info(f"DEBUG ATT: {type(att)} - {att}")
                        
                        if isinstance(att, str):
                             name = att.lower()
                             url = att 
                        elif isinstance(att, dict):
                             name = att.get('name', '').lower()
                             url = att.get('url', '')
                        else:
                             # Fallback or error
                             logger.warning(f"Unknown attachment type: {type(att)} - {att}")
                             continue
                        if 'uzasadnienie' in name:
                            # We found a justification!
                            # In a real scenario, we would download the PDF/HTML here.
                            # For now, let's log it or update a 'has_justification' flag if we had one.
                            # Or append to summary if summary is empty.
                            
                            logger.info(f"🖨️ Found Justification for Print {p.number}: {url}")
                            found_justification = True
                            # TODO: Download content from att['url'] and save to DB
                            # This requires PDF parsing (OCR) if it's a PDF, or HTML parsing.
                            # For now, we just identify them.
                            
                    if found_justification:
                        count += 1
                        
            except Exception as e:
                logger.error(f"Error {p.number}: {e}")
            
            # Rate limit
            time.sleep(0.1)
            
            if count > 0 and count % 10 == 0:
                logger.info(f"Found {count} justifications so far...")

    finally:
        session.close()

if __name__ == "__main__":
    backfill_prints()
