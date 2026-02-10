from sqlalchemy.orm import Session
from backend.core.orm_db import SessionLocal
from backend.models import MP

def check_sikorski():
    db = SessionLocal()
    mps = db.query(MP).filter(MP.last_name.ilike('%Sikorski%')).all()
    for m in mps:
        print(f"ID: {m.id}, Name: {m.first_name} {m.last_name}, Term: {m.term}")
    db.close()

if __name__ == "__main__":
    check_sikorski()
