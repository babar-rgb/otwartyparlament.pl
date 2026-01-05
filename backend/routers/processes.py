from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from backend import models
from backend.core import orm_db as database

router = APIRouter()

@router.get("")
def read_processes(
    skip: int = 0,
    limit: int = 100,
    term: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Bill)
    if term is not None:
        query = query.filter(models.Bill.term if hasattr(models.Bill, 'term') else models.Bill.date.cast(models.Date) > '2023-11-01') 
        # Note: Bill might not have term column, but let's check models.py
        # Models.py says Bill has term? No, I'll check again.
    
    # Check if Bill has term
    if term is not None and hasattr(models.Bill, 'term'):
        query = query.filter(models.Bill.term == term)
        
    total = query.count()
    bills = query.order_by(models.Bill.date.desc()).offset(skip).limit(limit).all()
    
    # Manual serialization
    final_items = []
    for b in bills:
        b_dict = {c.name: getattr(b, c.name) for c in b.__table__.columns}
        final_items.append(b_dict)
        
    return {
        "items": final_items,
        "total": total
    }

@router.get("/count")
def read_processes_count(term: Optional[int] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Bill)
    if term is not None and hasattr(models.Bill, 'term'):
        query = query.filter(models.Bill.term == term)
    return {"count": query.count()}

@router.get("/{process_id}")
def read_process(process_id: str, db: Session = Depends(database.get_db)):
    # Try by process_id (RPS-123) or id
    bill = db.query(models.Bill).filter(models.Bill.process_id == process_id).first()
    if not bill and process_id.isdigit():
        bill = db.query(models.Bill).filter(models.Bill.id == int(process_id)).first()
        
    if bill is None:
        raise HTTPException(status_code=404, detail="Process not found")
        
    b_dict = {c.name: getattr(bill, c.name) for c in bill.__table__.columns}
    return b_dict
