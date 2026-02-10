from sqlalchemy import text
from backend.core.orm_db import SessionLocal

def debug_fts(query="ciąży"):
    db = SessionLocal()
    print(f"Testing FTS for query: '{query}'")
    
    try:
        # Check if 'polish' config parses it correctly
        # Note: formatting query safe against sql injection in real app, here checking logic
        tsq = db.execute(text(f"SELECT websearch_to_tsquery('polish', '{query}')")).scalar()
        print(f"Parsed Query (should be 'ciąż'): {tsq}")
        
        # Check for matches
        print("\nSearching database...")
        sql = text("""
            SELECT title_clean 
            FROM votes 
            WHERE search_vector @@ websearch_to_tsquery('polish', :q)
            LIMIT 5
        """)
        results = db.execute(sql, {"q": query}).fetchall()
        
        if not results:
             print("No FTS matches found.")
        else:
            print(f"Found matches (first 5):")
            for r in results:
                print(f"- {r[0]}")
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_fts()
