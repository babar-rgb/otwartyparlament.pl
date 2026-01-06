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
    q: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Bill)
    
    # Filter by term if provided
    if term is not None and hasattr(models.Bill, 'term'):
        query = query.filter(models.Bill.term == term)
    
    if q and len(q) > 3:
        # Semantic Search Path
        from backend.services.embedding import embedding_service
        # Fetch all bills with embeddings to rank them
        all_bills = query.filter(models.Bill.vector_embedding != None).all()
        bills = embedding_service.semantic_search(q, all_bills, limit=limit)
        total = len(bills) # In semantic mode, total is limited by the ranking
    else:
        # Traditional Path
        if q:
            query = query.filter(models.Bill.title.ilike(f"%{q}%"))
            
        total = query.count()
        bills = query.order_by(models.Bill.date.desc()).offset(skip).limit(limit).all()
    
    # Manual serialization
    final_items = []
    for b in bills:
        b_dict = {c.name: getattr(b, c.name) for c in b.__table__.columns if c.name != 'vector_embedding'}
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
        
    b_dict = {c.name: getattr(bill, c.name) for c in bill.__table__.columns if c.name != 'vector_embedding'}
    
    # Include AI Analysis if exists
    if bill.analysis:
        b_dict["ai_analysis"] = {
            "summary": bill.analysis.summary,
            "pros": bill.analysis.pros,
            "cons": bill.analysis.cons,
            "impact": bill.analysis.impact,
            "importance": bill.analysis.importance
        }
    else:
        b_dict["ai_analysis"] = None
        
    return b_dict

@router.get("/{process_id}/related")
def read_related_processes(process_id: str, limit: int = 5, db: Session = Depends(database.get_db)):
    # 1. Find the source bill
    bill = db.query(models.Bill).filter(models.Bill.process_id == process_id).first()
    if not bill and process_id.isdigit():
        bill = db.query(models.Bill).filter(models.Bill.id == int(process_id)).first()
        
    if not bill or not bill.vector_embedding:
        return []
        
    # 2. Find all other bills with embeddings
    # We exclude the current bill from results
    others = db.query(models.Bill).filter(
        models.Bill.id != bill.id,
        models.Bill.vector_embedding != None
    ).all()
    
    # 3. Use embedding service to rank
    from backend.services.embedding import embedding_service
    
    # We use the current bill's title/desc as query context for similarity_search helper
    # but since we ALREADY have the vector, we should use a more direct method.
    # I'll add a 'find_similar' method to embedding_service.
    
    similar_bills = embedding_service.find_similar(bill.vector_embedding, others, limit=limit)
    
    # 4. Serialize
    results = []
    for sb in similar_bills:
        sb_dict = {c.name: getattr(sb, c.name) for c in sb.__table__.columns if c.name != 'vector_embedding'}
        results.append(sb_dict)
        
    return results
