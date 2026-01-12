from backend.core.orm_db import SessionLocal
from backend.models import Interpellation
import json

def check():
    db = SessionLocal()
    i = db.query(Interpellation).filter(Interpellation.id == 13935).first()
    if i:
        print(f"ID: {i.id}")
        print(f"Sent Date: {i.sent_date}")
        print(f"Raw Data Sent: {i.raw_data.get('sentDate')}")
        print(f"Raw Data Receipt: {i.raw_data.get('receiptDate')}")
    else:
        print("Not found")
    db.close()

if __name__ == "__main__":
    check()
