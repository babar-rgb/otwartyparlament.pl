from sqlalchemy import text
from backend.core.orm_db import engine

def check_extension():
    print("Checking pgvector availability...")
    with engine.connect() as conn:
        try:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
            print("SUCCESS: pgvector extension enabled!")
        except Exception as e:
            print(f"FAILURE: Could not enable pgvector. Error: {e}")
            print("Please install pgvector on your database host.")
            exit(1)

if __name__ == "__main__":
    check_extension()
