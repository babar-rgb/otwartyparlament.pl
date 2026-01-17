from backend.core.orm_db import SessionLocal
from backend.models import Bill

def check_bills():
    db = SessionLocal()
    
    for num in ["2103", "2135"]:
        bill = db.query(Bill).filter(Bill.number == num).first()
        if bill:
            print(f"📄 Bill {num} Found: {bill.title}")
            print(f"   Len: {len(bill.content) if bill.content else 0}")
            if bill.content:
                print(f"   Start: {bill.content[:100].replace('\n', ' ')}...")
        else:
            print(f"❌ Bill {num} NOT FOUND.")
        
    db.close()

if __name__ == "__main__":
    check_bills()
