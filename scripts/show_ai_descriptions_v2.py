import json
from sqlalchemy import text, func
from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis

def show_examples():
    db = SessionLocal()
    try:
        print("🤖 Fetching Example AI Descriptions (Term 10)...")
        print("-" * 60)
        
        # Get latest votes that HAVE analysis
        votes = db.query(Vote).join(VoteAnalysis).filter(
            Vote.term == 10,
        ).order_by(Vote.id.desc()).limit(5).all()
        
        if not votes:
            print("No descriptions found for Term 10 yet!")
            return

        for vote in votes:
            print(f"🗳️  Vote ID: {vote.id}")
            print(f"📌 Title: {vote.title_clean[:80]}...")
            print(f"📝 AI Description: {vote.ai_summary}")
            if vote.analysis:
                 print(f"✅ Pros: {vote.analysis.pros}")
                 print(f"⚠️ Cons: {vote.analysis.cons}")
                 if vote.analysis.mind_map:
                     try:
                         personas = json.loads(vote.analysis.mind_map)
                         print(f"🎭 Personas: {json.dumps(personas, indent=2, ensure_ascii=False)}")
                     except:
                         print(f"🎭 Personas (Raw): {vote.analysis.mind_map}")
            print(f"📊 Importance: {vote.importance}")
            print(f"📊 Importance: {vote.importance}")
            print("-" * 60)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    show_examples()
