
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from backend.models import Speech

db = SessionLocal()
empty = db.query(Speech).filter((Speech.content == None) | (Speech.content == '')).all()
print(f"Empty Speeches: {len(empty)}")
from sqlalchemy import func
max_id = db.query(func.max(Speech.id)).scalar()
print(f"Max Speech ID: {max_id}")
db.close()
