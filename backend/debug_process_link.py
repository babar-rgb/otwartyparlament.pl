import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

# Add parent directory to path to import backend modules
sys.path.append(os.path.abspath(os.path.join(os.getcwd(), '')))

from backend.core.config import config
from backend.core.orm_db import SessionLocal
from backend.models import LegislativeProcess, LegislativeStage

def debug_process(process_id):
    db = SessionLocal()
    try:
        process = db.query(LegislativeProcess).filter(LegislativeProcess.id == process_id).first()
        if not process:
            print(f"Process {process_id} not found.")
            return

        print(f"PROCESS: {process.title}")
        print(f"STATUS: {process.status}")
        print(f"START DATE: {process.start_date}")
        
        stages = db.query(LegislativeStage).filter(LegislativeStage.process_id == process_id).order_by(LegislativeStage.date.asc(), LegislativeStage.id.asc()).all()
        print(f"\nSTAGES FOUND: {len(stages)}")
        for i, stage in enumerate(stages):
            print(f"[{i+1}] {stage.date} | {stage.stage_type} | {stage.title} | Bill: {stage.bill_number} | Vote: {stage.vote_id}")

    finally:
        db.close()

if __name__ == "__main__":
    process_id = "f0dd4724-2b4a-472b-bb4d-7f0f56e1fa77"
    debug_process(process_id)
