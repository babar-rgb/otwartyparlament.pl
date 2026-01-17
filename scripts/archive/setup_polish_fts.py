from sqlalchemy import text
from backend.core.orm_db import SessionLocal

def setup_polish():
    db = SessionLocal()
    try:
        print("Setting up 'polish' text search configuration...")
        
        # 1. Drop if exists to be clean
        db.execute(text("DROP TEXT SEARCH CONFIGURATION IF EXISTS polish CASCADE;"))
        db.execute(text("DROP TEXT SEARCH DICTIONARY IF EXISTS polish_hunspell CASCADE;"))
        
        # 2. Create Dictionary
        # Note: postgres expects files in tsearch_data without extension in some vers, or with.
        # usually DictFile='pl_pl' implies 'pl_pl.dict'
        print("Creating Dictionary...")
        db.execute(text("""
            CREATE TEXT SEARCH DICTIONARY polish_hunspell (
                Template = ispell,
                DictFile = pl_pl,
                AffFile = pl_pl,
                StopWords = polish
            );
        """))
        
        # 3. Create Configuration
        print("Creating Configuration...")
        db.execute(text("CREATE TEXT SEARCH CONFIGURATION polish (COPY = simple);"))
        
        # 4. Map tokens to dictionary
        print("Mapping configuration...")
        db.execute(text("""
            ALTER TEXT SEARCH CONFIGURATION polish
            ALTER MAPPING FOR asciiword, asciihword, hword_asciipart,
            word, hword, hword_part
            WITH polish_hunspell, simple;
        """))
        
        db.commit()
        print("SUCCESS: 'polish' configuration created.")
        
        # 5. Test it
        print("Testing word 'ciąża'...")
        res = db.execute(text("SELECT ts_lexize('polish_hunspell', 'ciąża');")).fetchone()
        print(f"Stem for 'ciąża': {res[0]}")
        
        res2 = db.execute(text("SELECT ts_lexize('polish_hunspell', 'ciąży');")).fetchone()
        print(f"Stem for 'ciąży': {res2[0]}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_polish()
