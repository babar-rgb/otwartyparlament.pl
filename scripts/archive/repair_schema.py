from backend.core.orm_db import engine
from sqlalchemy import text

def repair_schema():
    with engine.connect() as conn:
        print("🔧 Repairing Schema...")
        
        # 1. Add procedural_context to vote_analyses
        try:
            conn.execute(text("ALTER TABLE vote_analyses ADD COLUMN IF NOT EXISTS procedural_context TEXT;"))
            print("✅ Added procedural_context to vote_analyses")
        except Exception as e:
            print(f"⚠️ Error adding procedural_context: {e}")

        # 2. Add mind_map to vote_analyses (just in case)
        try:
            conn.execute(text("ALTER TABLE vote_analyses ADD COLUMN IF NOT EXISTS mind_map TEXT;"))
            print("✅ Added mind_map to vote_analyses")
        except Exception as e:
            print(f"⚠️ Error adding mind_map: {e}")

        # 3. Create Legislative Tables if not exist
        # Note: SQLAlchemy's create_all usually handles this if run on startup, but let's be sure.
        # Ideally we'd use Base.metadata.create_all(bind=engine)
        
        from backend.models import Base
        Base.metadata.create_all(bind=engine)
        print("✅ Ensured all tables exist (LegislativeProcess, Stage, Link)")
        
        conn.commit()
        print("🏁 Repair Complete.")

if __name__ == "__main__":
    repair_schema()
