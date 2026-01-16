from backend.core.orm_db import SessionLocal
from backend.models import Bill

def find_budget_bill():
    db = SessionLocal()
    
    # Search for bills with "ustawy budżetowej na rok 2026"
    bills = db.query(Bill).filter(Bill.title.ilike("%ustawa budżetowa na rok 2026%")).all()
    if not bills:
         # try nominative
         bills = db.query(Bill).filter(Bill.title.ilike("%ustawy budżetowej na rok 2026%")).all()

    print(f"Found {len(bills)} candidates:")
    for b in bills:
        print(f"[{b.number}] {b.title} (Type: {b.type})")
        
    db.close()

if __name__ == "__main__":
    find_budget_bill()
