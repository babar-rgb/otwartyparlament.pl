import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from backend import models

db = SessionLocal()
count = db.query(models.BillAnalysis).count()
print(f"Total BillAnalysis records: {count}")
latest = db.query(models.BillAnalysis).order_by(models.BillAnalysis.created_at.desc()).first()
if latest:
    print(f"Latest Analysis for Bill {latest.bill_id}: {latest.summary[:50]}...")
db.close()
