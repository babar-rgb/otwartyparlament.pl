from backend.core.orm_db import SessionLocal
from backend.models import Bill, BillAnalysis
import json

def is_chinese(text):
    if not text: return False
    # Check string
    if isinstance(text, str):
        for char in text:
            if '\u4e00' <= char <= '\u9fff':
                return True
    # Check list (pros/cons)
    elif isinstance(text, list):
        for item in text:
            if is_chinese(item):
                return True
    return False

def audit_deep():
    db = SessionLocal()
    try:
        print("--- DEEP AUDIT FOR HALLUCINATIONS ---")
        analyses = db.query(BillAnalysis).all()
        bad_bills = []
        
        for a in analyses:
            if is_chinese(a.summary) or is_chinese(a.pros) or is_chinese(a.cons) or is_chinese(a.impact):
                bad_bills.append(a.bill_id)
                print(f"FOUND Chinese in Bill {a.bill_id}")
                
        print(f"\nTotal bills with deep hallucinations: {len(bad_bills)}")
        
        # Save for repair
        results = []
        for bill_id in bad_bills:
            bill = db.query(Bill).filter(Bill.id == bill_id).first()
            if bill:
                content_preview = bill.content[:4000] if bill.content else "NO CONTENT"
                results.append({
                    "id": bill.id,
                    "title": bill.title,
                    "content": content_preview
                })
                
        with open('backend/etl/analysis/repair_batch_deep.json', 'w') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
    finally:
        db.close()

if __name__ == "__main__":
    audit_deep()
