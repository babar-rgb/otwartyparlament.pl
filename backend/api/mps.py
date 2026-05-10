from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from backend.core.database import get_db
from backend.models.mp import MP
from backend.models.mp_vote import MPVote
from backend.models.vote import Vote

router = APIRouter()

@router.get("/", response_model=List[dict])
def read_mps(skip: int = 0, limit: int = 500, db: Session = Depends(get_db)):
    mps = db.query(MP).offset(skip).limit(limit).all()
    return [
        {
            "id": mp.id,
            "name": mp.name,
            "club": mp.club,
            "photo_url": mp.photo_url,
            "active": mp.active
        } for mp in mps
    ]

@router.get("/{mp_id}")
def read_mp(mp_id: int, db: Session = Depends(get_db)):
    mp = db.query(MP).filter(MP.id == mp_id).first()
    if not mp:
        raise HTTPException(status_code=404, detail="MP not found")
    
    # 1. WYDRĘBNIAMY STATYSTYKI (Frekwencja)
    total_votes_count = db.query(func.count(Vote.id)).scalar() or 1
    mp_present_count = db.query(func.count(MPVote.id)).\
        filter(MPVote.mp_id == mp_id).\
        filter(MPVote.choice != "NIEOBECNY").scalar() or 0
    
    attendance = round((mp_present_count / total_votes_count) * 100, 2)
    
    # 2. POBIERAMY HISTORIĘ GŁOSOWAŃ
    votes_history = db.query(MPVote, Vote).\
        join(Vote, MPVote.vote_id == Vote.id).\
        filter(MPVote.mp_id == mp_id).\
        order_by(Vote.date.desc()).limit(15).all()
    
    choice_map = {
        "YES": "ZA",
        "NO": "PRZECIW",
        "ABSTAIN": "WSTRZYMAŁ SIĘ",
        "ABSENT": "NIEOBECNY"
    }
    
    history_data = []
    for mp_v, v in votes_history:
        history_data.append({
            "id": v.id,
            "date": v.date.isoformat(),
            "title": v.title,
            "choice": choice_map.get(mp_v.choice, mp_v.choice)
        })

    return {
        "id": mp.id,
        "name": mp.name,
        "club": mp.club,
        "photo_url": mp.photo_url,
        "attendance": f"{attendance}%", # Nasza pierwsza "mądra" statystyka
        "votingHistory": history_data
    }
