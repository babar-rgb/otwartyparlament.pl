from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend import models
from backend.core import orm_db as database
from sqlalchemy import desc

router = APIRouter()

@router.get("", response_model=None) # We'll return dynamic dicts for now
def read_processes(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None, # 'IN_PROGRESS', 'COMPLETED'
    db: Session = Depends(database.get_db)
):
    query = db.query(models.LegislativeProcess)
    
    if status:
        query = query.filter(models.LegislativeProcess.status == status)
        
    # Default sort: Most recent start_date
    query = query.order_by(desc(models.LegislativeProcess.start_date))
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    # Serialize manually to include simple stage count or last stage date
    result = []
    for p in items:
        # Get stage count efficiently? Or just load them?
        # For MVP, simple load is fine (limit 20).
        stages_count = len(p.stages) 
        last_stage = p.stages[-1] if p.stages else None
        
        result.append({
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "stage_count": stages_count,
            "last_update": (last_stage.date.isoformat() if last_stage.date else None) if last_stage else (p.start_date.isoformat() if p.start_date else None),
            "last_stage_title": last_stage.title if last_stage else "Inicjacja"
        })
        
    return {"items": result, "total": total}

@router.get("/count")
def count_processes(
    term: Optional[int] = None, # Models don't have term yet, but frontend sends it
    status: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.LegislativeProcess)
    if status:
        query = query.filter(models.LegislativeProcess.status == status)
    
    # Note: LegislativeProcess currently doesn't have a 'term' column.
    # If added in future, filter here:
    # if term:
    #     query = query.filter(models.LegislativeProcess.term == term)
        
    return {"count": query.count()}


@router.get("/{process_id}")
def read_process_details(process_id: str, db: Session = Depends(database.get_db)):
    process = db.query(models.LegislativeProcess).filter(models.LegislativeProcess.id == process_id).first()
    if not process:
         raise HTTPException(status_code=404, detail="Process not found")
    
    # Return full object with stages sorted
    process.stages.sort(key=lambda x: x.date if x.date else "1900-01-01")
    
    # --- GRAPH DATA ---
    bill_numbers = set()
    for stage in process.stages:
        if stage.bill_number:
            bill_numbers.add(stage.bill_number)
            
    nodes = []
    edges = []
    
    if bill_numbers:
        from sqlalchemy import or_
        links = db.query(models.LegislativeLink).filter(
            or_(
                models.LegislativeLink.source_bill.in_(bill_numbers),
                models.LegislativeLink.target_bill.in_(bill_numbers)
            )
        ).all()
        
        # Build Node Set
        node_ids = set()
        for b in bill_numbers:
            node_ids.add(b)
        
        for link in links:
            node_ids.add(link.source_bill)
            node_ids.add(link.target_bill)
            
            edges.append({
                "source": link.source_bill,
                "target": link.target_bill,
                "type": link.relation_type
            })
            
        for nid in node_ids:
            nodes.append({"id": nid, "label": f"Druk {nid}"})
            
    # Serialize stages manually to avoid Date serialization issues
    stages_serialized = []
    if process.stages:
        for s in process.stages:
            stages_serialized.append({
                "id": s.id,
                "process_id": s.process_id,
                "stage_type": s.stage_type,
                "title": s.title,
                "description": s.description,
                "date": s.date.isoformat() if s.date else None,
                "bill_number": s.bill_number,
                "vote_id": s.vote_id
            })

    return {
        "id": process.id,
        "title": process.title,
        "status": process.status,
        "start_date": process.start_date.isoformat() if process.start_date else None,
        "stages": stages_serialized,
        "graph": {
            "nodes": nodes,
            "edges": edges
        }
    }
