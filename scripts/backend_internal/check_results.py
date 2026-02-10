
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from backend.models import VoteResult

db = SessionLocal()
count = db.query(VoteResult).count()
print(f"Total VoteResult records: {count}")
db.close()
