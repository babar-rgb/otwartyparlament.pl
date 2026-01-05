from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from backend import models
from backend.core import orm_db as database

router = APIRouter()

from sqlalchemy import exists

@router.get("")
def read_votes(
    skip: int = 0, 
    limit: int = 100, 
    term: Optional[int] = None,
    sitting: Optional[int] = None,
    voting_number: Optional[int] = None,
    mp_id: Optional[int] = None,
    print_number: Optional[str] = None,
    has_results: Optional[bool] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Vote)
    if term is not None:
        query = query.filter(models.Vote.term == term)
    if sitting is not None:
        query = query.filter(models.Vote.sitting == sitting)
    if voting_number is not None:
        query = query.filter(models.Vote.voting_number == voting_number)
    if has_results is True:
        query = query.filter(exists().where(models.VoteResult.vote_id == models.Vote.id))

    
    if mp_id is not None:
        # Join with results to get only votes where this MP participated and was not absent
        # We also need to select the result to return it
        query = query.join(models.VoteResult).filter(
            models.VoteResult.mp_id == mp_id
        ).add_columns(models.VoteResult.result)
    
    # Calculate total count based on filters (but before pagination)
    total = query.count()
    
    # Execute query with pagination and ordering
    if mp_id is not None:
        # results will be a list of tuples (Vote, result)
        results = query.order_by(models.Vote.date.desc(), models.Vote.voting_number.desc()).offset(skip).limit(limit).all()
        
        final_items = []
        for vote, result in results:
            vote_dict = {c.name: getattr(vote, c.name) for c in vote.__table__.columns}
            vote_dict['mp_vote'] = result
            final_items.append(vote_dict)
            
        return {
            "items": final_items,
            "total": total
        }
    else:
        # Standard case, results are Vote objects
        results = query.order_by(models.Vote.date.desc(), models.Vote.voting_number.desc()).offset(skip).limit(limit).all()
        
        final_items = []
        for vote in results:
            vote_dict = {c.name: getattr(vote, c.name) for c in vote.__table__.columns}
            final_items.append(vote_dict)
            
        return {
            "items": final_items,
            "total": total
        }

@router.get("/results")
def read_votes_results_v2(
    mp_id: Optional[int] = Query(None),
    vote_id: Optional[int] = Query(None),
    mp_ids: Optional[List[int]] = Query(None),
    limit: int = 1000,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.VoteResult)
    if mp_id:
        query = query.filter(models.VoteResult.mp_id == mp_id)
    if vote_id:
        query = query.filter(models.VoteResult.vote_id == vote_id)
    if mp_ids:
        query = query.filter(models.VoteResult.mp_id.in_(mp_ids))
    
    # Eager load the MP relationship to avoid N+1 queries
    results = query.options(joinedload(models.VoteResult.mp)).limit(limit).all()
    
    out = []
    for r in results:
        mp = r.mp
        out.append({
            "mp_id": r.mp_id,
            "vote_id": r.vote_id,
            "vote": r.result,
            "mp_first_name": mp.first_name if mp else "Unknown",
            "mp_last_name": mp.last_name if mp else "Unknown",
            "mp_club": mp.club if mp else "Unknown",
            "mp_options": "N/A" # Placeholder if needed, but not modifying model now
        })
    return out

@router.get("/{vote_id}")
def read_vote(vote_id: int, db: Session = Depends(database.get_db)):
    vote = db.query(models.Vote).filter(models.Vote.id == vote_id).first()
    if vote is None:
        raise HTTPException(status_code=404, detail="Vote not found")
    return vote

@router.get("/{vote_id}/analysis")
def read_vote_analysis(vote_id: int, db: Session = Depends(database.get_db)):
    analysis = db.query(models.VoteAnalysis).filter(models.VoteAnalysis.vote_id == vote_id).first()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.get("/{vote_id}/results")
def read_vote_results(vote_id: int, db: Session = Depends(database.get_db)):
    results = db.query(models.VoteResult).filter(models.VoteResult.vote_id == vote_id).options(joinedload(models.VoteResult.mp)).all()
    return results
