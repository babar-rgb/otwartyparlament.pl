from sqlalchemy.orm import Session
from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess, LegislativeLink, VoteAnalysis
from sqlalchemy import func

def double_verify():
    db: Session = SessionLocal()
    try:
        proc_count = db.query(LegislativeProcess).count()
        link_count = db.query(LegislativeLink).count()
        context_count = db.query(VoteAnalysis).filter(VoteAnalysis.procedural_context.isnot(None)).count()
        total_analyses = db.query(VoteAnalysis).count()

        print(f"--- DOUBLE VERIFICATION ---")
        print(f"✅ Processes: {proc_count}")
        print(f"✅ Graph Links: {link_count}")
        print(f"✅ AI Contexts: {context_count}/{total_analyses} ({(context_count/total_analyses*100) if total_analyses else 0:.1f}%)")
        
        if link_count > 0 and context_count > 0:
            print("🎉 SYSTEM IS HEALTHY AND POPULATING DATA")
        else:
            print("⚠️ DATA POPULATION IN PROGRESS (Wait for crawlers)")

    finally:
        db.close()

if __name__ == "__main__":
    double_verify()
