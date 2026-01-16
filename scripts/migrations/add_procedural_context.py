from backend.core.orm_db import SessionLocal
from sqlalchemy import text

def migrate():
    db = SessionLocal()
    print("🛠️ Migrating: Adding 'procedural_context' to 'vote_analyses'...")
    try:
        db.execute(text("ALTER TABLE vote_analyses ADD COLUMN IF NOT EXISTS procedural_context TEXT;"))
        db.commit()
        print("✅ Column added successfully.")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
