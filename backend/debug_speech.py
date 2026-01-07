
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from backend.models import Speech

db = SessionLocal()
s = db.query(Speech).filter(Speech.id == 102142).first()
if s:
    print(f"Speech Found: {s.id}")
    print(f"MP ID: {s.mp_id}")
    print(f"Date: {s.date}")
    # Inspect content columns
    # Model view below will confirm names, but likely 'transcript' or 'content'
    # I'll try to iterate keys if simple print fails or guess
    print(s.__dict__) 
else:
    print("Speech 102142 NOT FOUND in DB.")


total = db.query(Speech).count()
empty = db.query(Speech).filter((Speech.content == None) | (Speech.content == '')).count()
print(f"Total: {total}")
print(f"Empty Content: {empty}")

db.close()
