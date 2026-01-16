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
            "start_date": p.start_date,
            "stage_count": stages_count,
            "last_update": last_stage.date if last_stage else p.start_date,
            "last_stage_title": last_stage.title if last_stage else "Inicjacja"
        })
        
    return {"items": result, "total": total}

@router.get("/{process_id}")
def read_process_details(process_id: str, db: Session = Depends(database.get_db)):
    process = db.query(models.LegislativeProcess).filter(models.LegislativeProcess.id == process_id).first()
    if not process:
         raise HTTPException(status_code=404, detail="Process not found")
    
    # Return full object with stages sorted
    process.stages.sort(key=lambda x: x.date if x.date else "1900-01-01")
    
    return process
