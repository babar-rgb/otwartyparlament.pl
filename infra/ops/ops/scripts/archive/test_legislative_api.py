from backend.core.orm_db import SessionLocal
from backend.routers.votes import read_legislative_process_for_vote
from backend.models import LegislativeProcess

def test_api():
    db = SessionLocal()
    vote_id = 490049
    
    print(f"🔬 Testing API for Vote {vote_id}...")
    try:
        process = read_legislative_process_for_vote(vote_id, db)
        
        if process:
            print(f"✅ Process Found: {process.title} ({process.id})")
            print(f"📊 Process Status: {process.status}")
            print(f"🛤️ Stages ({len(process.stages)}):")
            for stage in process.stages:
                print(f"   - [{stage.date}] {stage.stage_type}: {stage.title}")
                if stage.vote_id == vote_id:
                     print("     (⬅️ CURRENT VOTE)")
        else:
            print("❌ No Process Linked (Is backfill running?)")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_api()
