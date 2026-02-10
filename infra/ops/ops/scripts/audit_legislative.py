from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess, LegislativeStage, LegislativeLink, VoteAnalysis
from sqlalchemy import func

def run_audit():
    db = SessionLocal()
    try:
        print("--- AUDYT SYSTEMU LEGISLACYJNEGO ---")
        
        # 1. Processes
        total_procs = db.query(LegislativeProcess).count()
        in_progress = db.query(LegislativeProcess).filter_by(status='IN_PROGRESS').count()
        completed = db.query(LegislativeProcess).filter_by(status='SIGNED').count()
        print(f"✅ Procesy Legislacyjne: {total_procs} (W toku: {in_progress}, Zakończone: {completed})")
        
        # 2. Stages (Timeline)
        total_stages = db.query(LegislativeStage).count()
        print(f"✅ Etapy (Timeline Nodes): {total_stages}")
        
        # 3. Links (Graph)
        total_links = db.query(LegislativeLink).count()
        print(f"🕸️ Połączenia (Graph Edges): {total_links}")
        
        # 4. AI Narrator
        total_analyses = db.query(VoteAnalysis).count()
        with_context = db.query(VoteAnalysis).filter(VoteAnalysis.procedural_context.isnot(None)).count()
        print(f"🧠 AI Analizy: {total_analyses}")
        print(f"🧠 AI Narracje (Context): {with_context} (Coverage: {with_context/total_analyses*100:.1f}%)" if total_analyses else "🧠 AI Narracje: 0")

    finally:
        db.close()

if __name__ == "__main__":
    run_audit()
