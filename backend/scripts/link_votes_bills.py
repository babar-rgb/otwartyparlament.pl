
import sys
import os
import logging
import time
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("link.votes")

def link_votes():
    session = SessionLocal()
    try:
        logger.info("🔗 Starting Vote <-> Bill Linker (SQL optimization)...")
        
        # We can do this with a single SQL UPDATE query which is instant
        # UPDATE votes SET bill_id = bills.id FROM bills WHERE votes.print_number = bills.number
        
        sql = """
            UPDATE votes 
            SET bill_id = bills.id 
            FROM bills 
            WHERE votes.print_number = bills.number 
              AND votes.bill_id IS NULL 
              AND votes.print_number IS NOT NULL
        """
        
        result = session.execute(text(sql))
        session.commit()
        
        logger.info(f"✅ Linked {result.rowcount} votes to bills instantly!")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    link_votes()
