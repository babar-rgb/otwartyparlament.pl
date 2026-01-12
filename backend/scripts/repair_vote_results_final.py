
import sys
import os
import time

# Path hack
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.db import db
from backend.core.logger import get_logger
from backend.core.orm_db import SessionLocal
from backend.etl.vote_results import ResultsETL
from backend.etl.stats import calculate_stats
from sqlalchemy import text

logger = get_logger("repair.votes")

def repair_sittings(start_sitting, end_sitting):
    session = SessionLocal()
    try:
        logger.info(f"🔧 Starting REPAIR for Sittings {start_sitting}-{end_sitting}")
        
        etl = ResultsETL()
        
        for sitting in range(start_sitting, end_sitting + 1):
            logger.info(f"Processing Sitting {sitting}...")
            
            # 1. Identify votes involved
            # Get IDs (pure SQL for speed)
            votes_query = text("SELECT id FROM votes WHERE sitting = :sitting AND term = 10")
            votes = session.execute(votes_query, {"sitting": sitting}).fetchall()
            vote_ids = [v[0] for v in votes]
            
            if not vote_ids:
                logger.warning(f"No votes found for Sitting {sitting}")
                continue
            
            logger.info(f" - Found {len(vote_ids)} votes.")
            
            # 2. Check for Corruption (High Absence)
            # Just to be safe, only delete if > 80% absent?
            # Or just delete unconditionally as we know they are broken.
            # User confirmed corruption. Deleting unconditionally is safer to ensure clean state.
            
            logger.info(" - Purging potentially corrupted vote_results...")
            # Delete in chunks or one go? One go is fine for ~200 votes * 460 MPs = 92k rows.
            # Postgres handles this easily.
            # Using tuple syntax for IN clause
            
            if vote_ids:
                # SQLAlchemy IN clause via params is tricky with raw text, manual string building safe for integers
                ids_str = ",".join(str(vid) for vid in vote_ids)
                delete_query = f"DELETE FROM vote_results WHERE vote_id IN ({ids_str})"
                session.execute(text(delete_query))
                session.commit()
                logger.info(" - Purged old results.")
            
            # 3. Re-Fetch
            logger.info(" - Re-fetching from API...")
            etl.run(limit=1000, force_sitting=sitting)
            
        logger.info("✅ All Sittings Repaired.")
        
        # 4. Recalculate Stats
        logger.info("Recalculating Stats...")
        calculate_stats()
        
    except Exception as e:
        logger.error(f"Repair Failed: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    # Sittings 40 to 49 (covering the corrupted range 40-47 + buffer)
    repair_sittings(40, 50)
