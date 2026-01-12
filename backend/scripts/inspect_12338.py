from backend.core.orm_db import SessionLocal
from backend.models import Interpellation
import json

def inspect():
    db = SessionLocal()
    i = db.query(Interpellation).filter(Interpellation.id == 12338).first()
    if i:
        print(f"ID: {i.id}")
        print(f"Reply Content: '{i.reply_content}'")
        print(f"Raw Data: {json.dumps(i.raw_data, indent=2, ensure_ascii=False)}")
    db.close()

if __name__ == "__main__":
    inspect()
