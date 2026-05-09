from backend.core import orm_db as database
from backend import models
from sqlalchemy.orm import Session
import json

db = next(database.get_db())

try:
    print("Testing LegislativeProcess count...")
    count = db.query(models.LegislativeProcess).count()
    print(f"Total processes: {count}")
    
    print("Testing LegislativeProcess fetch...")
    items = db.query(models.LegislativeProcess).limit(5).all()
    print(f"Fetched {len(items)} items.")
    
    for p in items:
        print(f"Process ID: {p.id}, Title: {p.title[:30]}...")
        # Check stages
        print(f"  Stages count: {len(p.stages)}")
        # Check associated bill
        bill = db.query(models.Bill).filter(models.Bill.process_id == p.id).first()
        print(f"  Bill: {bill.number if bill else 'None'}")
        
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
