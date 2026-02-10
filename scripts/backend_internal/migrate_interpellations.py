
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal, engine
from backend.models import Base
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS content TEXT;"))
        conn.commit()
    print("Column added.")

if __name__ == "__main__":
    add_column()
