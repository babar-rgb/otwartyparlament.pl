from backend.core.orm_db import SessionLocal
from backend.models import Bill
import re

def check_refs():
    db = SessionLocal()
    bill = db.query(Bill).filter(Bill.number == "2103").first()
    if bill and bill.content:
        print(f"Bill 2103 Content Len: {len(bill.content)}")
        refs = re.findall(r"druku? nr (\d+)", bill.content)
        print(f"References Found: {refs}")
    db.close()

if __name__ == "__main__":
    check_refs()
