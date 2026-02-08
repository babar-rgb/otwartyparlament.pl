
import sys
import os
import logging
import time
from sqlalchemy import text
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Bill
from backend.utils.http import http_session

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("backfill.bills")

def backfill_content(limit=3000):
    session = SessionLocal()
    try:
        # Get bills without description (or very short ones)
        # Using exact process_id for API calls
        bills = session.query(Bill).filter(
            (Bill.description == None) | (Bill.description == '')
        ).limit(limit).all()
        
        logger.info(f"Checking {len(bills)} bills for missing description...")
        
        count = 0
        for bill in bills:
            try:
                # Use print number or process ID to search?
                # Usually /processes/{id} gives details
                url = f"https://api.sejm.gov.pl/sejm/term10/processes/{bill.process_id}"
                resp = http_session.get(url, timeout=30)
                
                description = None
                if resp.status_code == 200:
                    data = resp.json()
                    # The 'description' field in API usually holds the short description
                    # But we want the full justification if available.
                    # Sejm API is tricky. Often justification is in a separate HTML print.
                    # For now, let's at least get the API description which is better than nothing.
                    description = data.get('description')
                    
                    # Try to get stages -> description if main is empty
                    if not description and data.get('stages'):
                        description = data['stages'][0].get('comment')
                        
                elif resp.status_code == 404:
                    description = "[NO CONTENT]"
                else:
                    logger.warning(f"Error {resp.status_code} for Process {bill.process_id}")
                    continue
                
                if description and len(description) > 5:
                    bill.description = description
                    session.add(bill)
                    session.commit()
                    count += 1
                    if count % 10 == 0:
                        logger.info(f"Processed {count}/{len(bills)} - {bill.title[:30]}...")
                
                # Rate limit
                time.sleep(0.5) 
                
            except Exception as e:
                logger.error(f"Failed Process {bill.process_id}: {e}")
                session.rollback()
                
        logger.info(f"Finished batch. Updated {count} records.")
        
    finally:
        session.close()

if __name__ == "__main__":
    backfill_content()
