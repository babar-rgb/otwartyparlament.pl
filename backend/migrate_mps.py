import sys
import os
from sqlalchemy import text
from backend.core.orm_db import engine

def migrate():
    print("Migrating mps table...")
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE mps ADD COLUMN IF NOT EXISTS birth_date DATE;"))
        conn.execute(text("ALTER TABLE mps ADD COLUMN IF NOT EXISTS birth_location VARCHAR;"))
        conn.execute(text("ALTER TABLE mps ADD COLUMN IF NOT EXISTS profession VARCHAR;"))
        conn.execute(text("ALTER TABLE mps ADD COLUMN IF NOT EXISTS education_level VARCHAR;"))
        conn.execute(text("ALTER TABLE mps ADD COLUMN IF NOT EXISTS education_history JSONB;"))
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
