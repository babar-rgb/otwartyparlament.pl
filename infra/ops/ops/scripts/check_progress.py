from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess, LegislativeStage, VoteAnalysis, Vote, Bill, BillAnalysis
from sqlalchemy import func

def check_progress():
    db = SessionLocal()
    try:
        # 1. Counts
        process_count = db.query(func.count(LegislativeProcess.id)).scalar()
        stage_count = db.query(func.count(LegislativeStage.id)).scalar()
        
        # Votes
        total_votes = db.query(func.count(Vote.id)).scalar()
        analyzed_votes = db.query(func.count(VoteAnalysis.vote_id)).scalar()
        remaining_votes = total_votes - analyzed_votes
        
        # Bills (Projects)
        total_bills = db.query(func.count(Bill.id)).scalar()
        analyzed_bills = db.query(func.count(BillAnalysis.bill_id)).scalar()
        remaining_bills = total_bills - analyzed_bills

        # 2. Estimation (Average 5s per item for Gemini Flash-Lite)
        avg_speed_sec = 5 
        total_remaining = remaining_votes + remaining_bills
        est_seconds = total_remaining * avg_speed_sec
        est_hours = est_seconds / 3600
        
        print(f"📊 Progress Report:")
        print(f"   ---------------------------------------")
        print(f"   🚦 Legislative Processes: {process_count} found")
        print(f"   ---------------------------------------")
        print(f"   🗳️  Votes: {analyzed_votes} / {total_votes} ({remaining_votes} pending)")
        print(f"   📜  Bills: {analyzed_bills} / {total_bills} ({remaining_bills} pending)")
        print(f"   ---------------------------------------")
        print(f"   ⏱️  Est. Remaining Time: ~{est_hours:.1f} hours")
        print(f"   (Assuming {avg_speed_sec}s per item)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_progress()
