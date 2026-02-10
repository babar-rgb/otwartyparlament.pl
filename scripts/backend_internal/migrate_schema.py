from backend.core.orm_db import engine
from sqlalchemy import text

def migrate():
    print("Migrating schema...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE bills ADD COLUMN content TEXT"))
            conn.commit()
            print("Successfully added 'content' column to 'bills' table.")
        except Exception as e:
            print(f"Migration failed (might already exist): {e}")

if __name__ == "__main__":
    migrate()
