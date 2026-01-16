from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reset")

def reset_vote(vote_id=490049):
    db = SessionLocal()
    
    # Check link
    vote = db.query(Vote).filter(Vote.id == vote_id).first()
    if not vote:
        logger.error("Vote not found")
        return

    logger.info(f"Vote {vote.id}: {vote.title_clean}")
    if vote.bill:
        logger.info(f"Linked Bill: {vote.bill.number} - {vote.bill.title}")
    else:
        logger.warning("No Linked Bill found!")

    # Delete Analysis
    db.query(VoteAnalysis).filter(VoteAnalysis.vote_id == vote_id).delete()
    
    # Clear Polluted Description (Feedback Loop)
    vote.description = None
    vote.importance = 0
    vote.topic = None
    
    db.commit()
    logger.info("Analysis deleted and description cleared. Ready for backfill.")
    db.close()

if __name__ == "__main__":
    reset_vote()
