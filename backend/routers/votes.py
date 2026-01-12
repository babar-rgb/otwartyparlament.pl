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
    rebellion: Optional[bool] = None,
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
        if rebellion:
            # Rebellious votes: MP result != Club Majority
            # We use a raw SQL approach for efficiency relative to the 'stats.py' logic
            from sqlalchemy import text
            
            # This query mimics stats.py:
            # 1. Finds consensus for the MP's club for each vote
            # 2. Compares MP's vote to consensus
            # 3. Returns filtering IDs
            # Note: We filter by term if provided to speed it up
            
            raw_sql = """
                WITH target_mp AS (
                    SELECT id, club, term FROM mps WHERE id = :mp_id
                ),
                vote_results_filtered AS (
                    SELECT vr.vote_id, vr.result, v.term
                    FROM vote_results vr
                    JOIN votes v ON vr.vote_id = v.id
                    JOIN target_mp t ON vr.mp_id = t.id
                    WHERE v.term = t.term
                ),
                club_votes AS (
                    SELECT vr.vote_id, vr.result, count(*) as cnt
                    FROM vote_results vr
                    JOIN mps m ON vr.mp_id = m.id
                    JOIN target_mp t ON m.club = t.club
                    JOIN votes v ON vr.vote_id = v.id
                    WHERE v.term = t.term
                    GROUP BY vr.vote_id, vr.result
                ),
                club_winners AS (
                    SELECT DISTINCT ON (vote_id) vote_id, result as majority_result
                    FROM club_votes
                    ORDER BY vote_id, cnt DESC
                )
                SELECT vrf.vote_id
                FROM vote_results_filtered vrf
                JOIN club_winners cw ON vrf.vote_id = cw.vote_id
                WHERE vrf.result != cw.majority_result
                  AND vrf.result IN ('YES', 'NO', 'ABSTAIN')
                  AND cw.majority_result IN ('YES', 'NO', 'ABSTAIN')
            """
            
            rebel_vote_ids = db.execute(text(raw_sql), {"mp_id": mp_id}).fetchall()
            rebel_ids_list = [r[0] for r in rebel_vote_ids]
            
            # Apply filter
            if not rebel_ids_list:
                # No rebellions found, return empty result strictly
                query = query.filter(models.Vote.id == -1) 
            else:
                query = query.filter(models.Vote.id.in_(rebel_ids_list))
        
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
    vote = db.query(models.Vote).filter(models.Vote.id == vote_id).options(joinedload(models.Vote.analysis)).first()
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

@router.post("/{vote_id}/analyze")
def generate_vote_analysis(vote_id: int, db: Session = Depends(database.get_db)):
    # 1. Check if analysis already exists
    existing = db.query(models.VoteAnalysis).filter(models.VoteAnalysis.vote_id == vote_id).first()
    if existing:
        return existing

    # 2. Fetch vote data
    vote = db.query(models.Vote).filter(models.Vote.id == vote_id).first()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")

    # 3. Call Ollama Service
    from backend.services.ollama import ollama_service
    from backend.models import Bill
    import re

    # Prepare context
    title = vote.title_clean or vote.title_raw
    context = f"Tytuł: {title}\nOpis: {vote.description or ''}"
    
    # Try to find print number in title for extra context
    match = re.search(r'druki? nr (\d+)', title, re.IGNORECASE)
    if match:
        print_nr = match.group(1)
        bill = db.query(Bill).filter(Bill.number == print_nr).first()
        if bill:
            context += f"\n\nPowiązany Projekt Ustawy (Druk {print_nr}): {bill.title}\nUzasadnienie projektu: {bill.description or ''}"

    analysis_data = ollama_service.analyze_vote(title, context)
    
    if not analysis_data:
        raise HTTPException(status_code=500, detail="AI Analysis failed")

    # 4. Save result
    analysis = models.VoteAnalysis(
        vote_id=vote.id,
        summary=analysis_data.get("summary"),
        pros=analysis_data.get("pros", []),
        cons=analysis_data.get("cons", []),
        mind_map=analysis_data.get("mind_map")
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis
