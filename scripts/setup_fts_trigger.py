from sqlalchemy import text
from backend.core.orm_db import SessionLocal

def setup_trigger():
    db = SessionLocal()
    try:
        print("Creating FTS update trigger...")
        
        # 1. Create Function
        print("Defining trigger function 'votes_search_vector_update'...")
        db.execute(text("""
            CREATE OR REPLACE FUNCTION votes_search_vector_update() RETURNS trigger AS $$
            BEGIN
                NEW.search_vector := to_tsvector('polish', 
                    coalesce(NEW.title_clean, '') || ' ' || coalesce(NEW.description, '')
                );
                RETURN NEW;
            END
            $$ LANGUAGE plpgsql;
        """))
        
        # 2. Drop Trigger if exists (to be safe)
        db.execute(text("DROP TRIGGER IF EXISTS tsvector_update_trigger ON votes;"))
        
        # 3. Create Trigger
        print("Creating trigger 'tsvector_update_trigger' on 'votes' table...")
        db.execute(text("""
            CREATE TRIGGER tsvector_update_trigger
            BEFORE INSERT OR UPDATE
            ON votes
            FOR EACH ROW
            EXECUTE FUNCTION votes_search_vector_update();
        """))
        
        db.commit()
        print("SUCCESS: Trigger created. New votes will be indexed automatically.")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_trigger()
