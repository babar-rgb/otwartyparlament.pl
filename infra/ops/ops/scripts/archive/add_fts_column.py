from sqlalchemy import text
from backend.core.orm_db import SessionLocal

def migrate_fts():
    db = SessionLocal()
    try:
        print("Adding 'search_vector' column to 'votes' table...")
        # 1. Add Column
        try:
            db.execute(text("ALTER TABLE votes ADD COLUMN search_vector tsvector"))
            print("Column added.")
        except Exception as e:
            print(f"Column might already exist: {e}")
            db.rollback()

        # 2. Update Data
        print("Populating 'search_vector' (this may take a moment)...")
        # We concatenate title_clean and description (if exists)
        # We use 'polish' config we just created
        db.execute(text("""
            UPDATE votes 
            SET search_vector = to_tsvector('polish', 
                coalesce(title_clean, '') || ' ' || coalesce(description, '')
            )
        """))
        
        # 3. Create Index
        print("Creating GIN index...")
        db.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_votes_search_vector 
            ON votes USING GIN(search_vector)
        """))
        
        db.commit()
        print("SUCCESS: FTS migration completed.")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_fts()
