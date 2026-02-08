
import logging
from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend.models import MP, VoteResult

logger = logging.getLogger("scripts.recalculate_stats")
logging.basicConfig(level=logging.INFO)

def recalculate():
    session = SessionLocal()
    try:
        logger.info("Recalculating MP stats...")
        
        # 1. Get all MPs
        mps = session.query(MP).filter(MP.active == True).all()
        
        for mp in mps:
            # Get all vote results for this MP
            total_votes = session.query(VoteResult).filter(VoteResult.mp_id == mp.id).count()
            
            if total_votes == 0:
                continue
                
            # Count absences
            absent = session.query(VoteResult).filter(
                VoteResult.mp_id == mp.id, 
                VoteResult.result == 'ABSENT'
            ).count()
            
            attendance = ((total_votes - absent) / total_votes) * 100
            
            # Simple rebellion logic: Voted against club majority?
            # This is complex to calculate perfectly without caching club votes.
            # detailed rebellion logic is better left for a separate scheduled job.
            # For now, let's fix attendance which is the main complaint.
            
            mp.stats_attendance = round(attendance, 2)
            
            # Update
            session.add(mp)
            
        session.commit()
        logger.info(f"Updated stats for {len(mps)} IDs.")
        
    except Exception as e:
        logger.error(f"Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    recalculate()
