from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis
from sqlalchemy import delete

def reset():
    db = SessionLocal()
    try:
        # Find T10 vote IDs
        vote_ids = [v.id for v in db.query(Vote.id).filter(Vote.term == 10).all()]
        if not vote_ids:
            print("No T10 votes found.")
            return

        print(f"Deleting analyses for {len(vote_ids)} votes in Term 10...")
        
        stmt = delete(VoteAnalysis).where(VoteAnalysis.vote_id.in_(vote_ids))
        result = db.execute(stmt)
        db.commit()
        
        print(f"Deleted {result.rowcount} analyses. Ready for clean backfill.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset()
