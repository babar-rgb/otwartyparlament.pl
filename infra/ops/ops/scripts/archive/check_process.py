from backend.core.orm_db import SessionLocal
from backend.models import Bill

def check_process():
    db = SessionLocal()
    
    # Check 2103
    bill_2103 = db.query(Bill).filter(Bill.number == "2103").first()
    if not bill_2103:
        print("Bill 2103 not found")
        return

    print(f"Bill 2103: {bill_2103.title}")
    print(f"Process ID: {bill_2103.process_id}")
    
    if bill_2103.process_id:
        # Find all bills in this process
        related = db.query(Bill).filter(Bill.process_id == bill_2103.process_id).order_by(Bill.number).all()
        print(f"\n--- Related Bills in Process {bill_2103.process_id} ---")
        for b in related:
            print(f"[{b.number}] {b.title[:80]}... (Len: {len(b.content) if b.content else 0})")
            
    db.close()

if __name__ == "__main__":
    check_process()
