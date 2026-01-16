from sqlalchemy import text
from backend.core.orm_db import engine
import time

def migrate_table(table_name):
    print(f"\nMigrating table: {table_name}")
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 1. Add new column
            print(f"Adding column vector_embedding_v2 to {table_name}...")
            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS vector_embedding_v2 vector(384)"))
            
            # 2. Copy data with casting
            print("Copying data (JSONB -> TEXT -> VECTOR)...")
            # JSONB array [0.1, 0.2] casts to text "[0.1, 0.2]" which vector type matches
            conn.execute(text(f"UPDATE {table_name} SET vector_embedding_v2 = vector_embedding::text::vector WHERE vector_embedding IS NOT NULL"))
            
            # 3. Create HNSW Index (for fast search)
            print("Creating HNSW Index...")
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS {table_name}_vector_idx ON {table_name} USING hnsw (vector_embedding_v2 vector_cosine_ops)"))
            
            # 4. Swap columns
            print("Swapping columns...")
            conn.execute(text(f"ALTER TABLE {table_name} RENAME COLUMN vector_embedding TO vector_embedding_old"))
            conn.execute(text(f"ALTER TABLE {table_name} RENAME COLUMN vector_embedding_v2 TO vector_embedding"))
            
            trans.commit()
            print(f"SUCCESS: {table_name} migrated.")
            
        except Exception as e:
            trans.rollback()
            print(f"FAILED: {e}")
            raise e

if __name__ == "__main__":
    print("Starting Vector Migration...")
    try:
        migrate_table("votes")
        migrate_table("bills")
        
        # Check if euro_votes exists
        with engine.connect() as conn:
            exists = conn.execute(text("SELECT to_regclass('public.euro_votes')")).scalar()
            if exists:
                migrate_table("euro_votes")
                
        print("\nAll migrations completed successfully!")
    except Exception as e:
        print("\nGlobal Migration Failed!")
