from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis

def sync_descriptions():
    db = SessionLocal()
    try:
        print("🚀 Starting sync: VoteAnalysis.summary -> Vote.description")
        
        # SQL is faster for mass updates than ORM
        # We also want to ensure the trigger fires. 
        # Standard UPDATE in Postgres fires triggers.
        
        query = text("""
            UPDATE votes v
            SET description = va.summary
            FROM vote_analyses va
            WHERE v.id = va.vote_id
            AND va.summary IS NOT NULL
            AND (v.description IS NULL OR v.description = '');
        """)
        
        print("Executing bulk update...")
        result = db.execute(query)
        db.commit()
        
        print(f"✅ Synced descriptions for {result.rowcount} votes.")
        print("ℹ️  The 'tsvector_update_trigger' should have automatically updated the search index.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_descriptions()
