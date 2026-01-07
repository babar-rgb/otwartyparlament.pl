
import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from backend.core.orm_db import SessionLocal
from backend.models import Interpellation, CommitteeSitting, EuroVote, EuroVoteResult

db = SessionLocal()

print("--- INTERPELACJE ---")
intr = db.query(Interpellation).first()
if intr:
    print(json.dumps(intr.raw_data, indent=2)[:500])
else:
    print("Zero Interpellations")

print("\n--- KOMISJE ---")
comm = db.query(CommitteeSitting).first()
if comm:
    print(f"Video: {comm.video_url}")
    print(f"Agenda: {comm.agenda}")
else:
    print("Zero Sittings")
    
print("\n--- EUROPARLAMENT ---")
euro_votes = db.query(EuroVote).count()
euro_results = db.query(EuroVoteResult).count()
print(f"Votes: {euro_votes}, Results: {euro_results}")

db.close()
