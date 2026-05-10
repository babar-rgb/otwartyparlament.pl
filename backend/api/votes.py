from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from backend.core.database import get_db
from backend.models.vote import Vote
from backend.models.mp_vote import MPVote
from backend.models.mp import MP

router = APIRouter()

@router.get("/", response_model=List[dict])
def read_votes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    votes = db.query(Vote).order_by(Vote.date.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": v.id,
            "date": v.date.isoformat(),
            "title": v.title,
            "verdict": v.verdict,
            "results_json": v.results_json
        } for v in votes
    ]

@router.get("/{vote_id}")
def read_vote(vote_id: int, db: Session = Depends(get_db)):
    vote = db.query(Vote).filter(Vote.id == vote_id).first()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    # WYGRZEBYWANIE ROZKŁADU WG KLUBÓW
    # Poprawka: szukamy YES/NO/ABSTAIN bo tak zapisuje SejmSyncService
    club_results = db.query(
        MP.club,
        func.count(MPVote.id).filter(MPVote.choice == "YES").label("yes"),
        func.count(MPVote.id).filter(MPVote.choice == "NO").label("no"),
        func.count(MPVote.id).filter(MPVote.choice == "ABSTAIN").label("abstain")
    ).join(MPVote, MP.id == MPVote.mp_id).\
      filter(MPVote.vote_id == vote_id).\
      group_by(MP.club).all()

    breakdown = []
    for row in club_results:
        breakdown.append({
            "club": row.club or "NIEZRZESZENI",
            "yes": row.yes,
            "no": row.no,
            "abstain": row.abstain,
            "total": row.yes + row.no + row.abstain
        })

    return {
        "id": vote.id,
        "date": vote.date.isoformat(),
        "title": vote.title,
        "verdict": vote.verdict,
        "results": vote.results_json,
        "breakdown": sorted(breakdown, key=lambda x: x['total'], reverse=True)
    }
