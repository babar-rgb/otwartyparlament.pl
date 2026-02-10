from sqlalchemy.orm import Session
from backend.core.orm_db import SessionLocal
from backend.models import Interpellation
import json

def check_coverage():
    db = SessionLocal()
    total = db.query(Interpellation).count()
    with_reply = db.query(Interpellation).filter(Interpellation.reply_content != None).count()
    
    print(f"Total Interpellations: {total}")
    print(f"With Reply Content: {with_reply}")
    print(f"Coverage: {with_reply/total*100:.1f}%" if total > 0 else "N/A")

    # Check for missing replies where metadata says they exist
    # Inspect raw_data of one interpellation to see structure
    sample = db.query(Interpellation).first()
    if sample:
        print(f"Sample raw_data keys: {sample.raw_data.keys() if sample.raw_data else 'None'}")
        if sample.raw_data and 'replies' in sample.raw_data:
            print(f"Sample replies: {sample.raw_data['replies']}")

    # Count how many have 'replies' in raw_data but no 'reply_content'
    # This might require iterating if raw_data is JSONB and we can't easily query keys in pure SQL without specialized operators, 
    # but for this script iteration is fine for <10k records.
    
    missing_content = 0
    prolongations = 0
    real_missing = 0
    
    candidates = db.query(Interpellation).all()
    for i in candidates:
        has_metadata_reply = False
        is_prolongation = False
        
        if i.raw_data and 'replies' in i.raw_data and i.raw_data['replies']:
            # Check if ANY reply is NOT a prolongation
            for r in i.raw_data['replies']:
                if r.get('prolongation'):
                    is_prolongation = True
                else:
                    has_metadata_reply = True # Found at least one real reply
                    is_prolongation = False # Priorities real reply
                    break
            
            # If all are prolongations, mark as such
            if not has_metadata_reply and is_prolongation:
                # technically it has metadata reply, but it's just a prolongation
                pass 

        # We treat "prolongation only" as "No Content Expected" for now?
        # Or does the user want to see "Wniosek o przedłużenie"?
        
        # Le's count purely based on: existing 'replies' entry vs reply_content
        if i.raw_data and 'replies' in i.raw_data and i.raw_data['replies'] and not i.reply_content:
             # Check if it's purely prolongation
             all_prolong = all(r.get('prolongation') for r in i.raw_data['replies'])
             if all_prolong:
                 prolongations += 1
             else:
                 real_missing += 1
                 if real_missing <= 5:
                     print(f"REAL Missing: ID {i.id}, replies: {i.raw_data['replies']}")

    print(f"Total Missing Content: {prolongations + real_missing}")
    print(f"  - Prolongations (Just requests for time): {prolongations}")
    print(f"  - Real Missing Answers: {real_missing}")

    db.close()

if __name__ == "__main__":
    check_coverage()
