import sys, os; sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sys, os; sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend import models
from backend.core import orm_db as database
from sqlalchemy import desc, or_

router = APIRouter()

@router.get("", response_model=None) # We'll return dynamic dicts for now
def read_processes(
    skip: int = 0,
    limit: int = 20,
    term: Optional[int] = Query(10), # Default to current term X
    status: Optional[str] = None, # 'IN_PROGRESS', 'COMPLETED'
    type: Optional[str] = None,
    only_bills: bool = False,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.LegislativeProcess)
    
    if only_bills:
        query = query.filter(models.LegislativeProcess.base_number.isnot(None), models.LegislativeProcess.base_number != "")
    
    if term:
        query = query.filter(or_(models.LegislativeProcess.term == term, models.LegislativeProcess.term.is_(None)))

    if status:
        query = query.filter(models.LegislativeProcess.status == status)
        
    if type:
        # Join with Bill to filter by source type (e.g. 'Rządowy', 'Poselski')
        query = query.join(models.Bill, models.Bill.process_id == models.LegislativeProcess.id)
        query = query.filter(models.Bill.type == type)
        
    # Default sort: Most recent start_date
    # Relax filter: Differentiate between processes that have prints and those that don't, 
    # but don't hide everything just because base_number is missing if they have a title.
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
        # Fetch associated Bill to get number and type
        bill = db.query(models.Bill).filter(models.Bill.process_id == p.id).first()
        
        result.append({
            "id": p.id,
            "title": p.title,
            "status": p.status,
            "number": bill.number if bill else p.base_number,
            "type": bill.type if bill else "Inny",
            "term": bill.term if bill else p.term,
            "start_date": p.start_date.isoformat() if p.start_date else None,
            "stage_count": stages_count,
            "last_update": (last_stage.date.isoformat() if last_stage.date else None) if last_stage else (p.start_date.isoformat() if p.start_date else None),
            "last_stage_title": last_stage.title if last_stage else "Inicjacja",
            "ai_summary": bill.description if bill else p.description
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
        # Fallback: Check if it's a Bill ID (RPS or PK) or Slug
        bill = db.query(models.Bill).filter(or_(models.Bill.process_id == process_id, models.Bill.slug == process_id)).first()
        if not bill and process_id.isdigit():
            bill = db.query(models.Bill).filter(models.Bill.id == int(process_id)).first()
            
        if not bill:
            raise HTTPException(status_code=404, detail="Process or Bill not found")
            
        # Return a Bill-compatible format that the frontend can partially render
        return {
            "id": bill.process_id or str(bill.id),
            "title": bill.title,
            "status": "W toku", # Generic
            "start_date": bill.date.isoformat() if bill.date else None,
            "stages": [
                {
                    "id": 0,
                    "stage_type": "Druk",
                    "title": f"Druk nr {bill.number}",
                    "description": bill.title,
                    "date": bill.date.isoformat() if bill.date else None,
                    "bill_number": bill.number
                }
            ],
            "ai_analysis": {
                "summary": bill.analysis.summary if bill.analysis else None,
                "pros": bill.analysis.pros if bill.analysis else [],
                "cons": bill.analysis.cons if bill.analysis else [],
                "impact": bill.analysis.impact if bill.analysis else None,
                "importance": bill.analysis.importance if bill.analysis else 5
            } if bill.analysis else None,
            "graph": {"nodes": [], "edges": []}
        }
    
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

    # Fetch associated Bill to get content, analysis, number, etc.
    bill = db.query(models.Bill).filter(models.Bill.process_id == process.id).first()
    
    analysis_data = None
    if bill and bill.analysis:
        analysis_data = {
            "summary": bill.analysis.summary,
            "pros": bill.analysis.pros,
            "cons": bill.analysis.cons,
            "impact": bill.analysis.impact,
            "importance": bill.analysis.importance
        }

    return {
        "id": process.id,
        "title": bill.title if bill else process.title, # Bill title is often cleaner/more complete
        "status": process.status,
        "type": bill.type if bill else None,
        "number": bill.number if bill else process.base_number,
        "term": bill.term if bill else process.term,
        "url": bill.url if bill else None,
        "content": bill.content if bill else process.description,
        "ai_summary": process.description, # For easier access in frontend
        "ai_analysis": analysis_data,
        "start_date": process.start_date.isoformat() if process.start_date else None,
        "stages": stages_serialized,
        "graph": {
            "nodes": nodes,
            "edges": edges
        }
    }
