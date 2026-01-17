from backend.core.orm_db import SessionLocal
from backend.models import Bill

def check_bill_content():
    db = SessionLocal()
    bill = db.query(Bill).filter(Bill.number == "2103").first()
    if bill:
        print(f"Bill 2103 Found: {bill.title}")
        print(f"Content Length: {len(bill.content) if bill.content else 0}")
        if bill.content:
            print(f"Content Preview: {bill.content[:200]}...")
    else:
        print("Bill 2103 NOT FOUND in DB.")
        
    db.close()

if __name__ == "__main__":
    check_bill_content()
