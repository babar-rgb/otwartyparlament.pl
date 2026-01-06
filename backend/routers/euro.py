from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from backend import models
from backend.core import orm_db as database

router = APIRouter()

@router.get("/votes")
def read_euro_votes(
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = None,
    key_only: bool = False,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.EuroVote)
    if key_only:
        query = query.filter(models.EuroVote.is_key_vote == True)
    return query.order_by(models.EuroVote.date.desc()).offset(skip).limit(limit).all()

@router.get("/mps")
def read_euro_mps(
    term: Optional[int] = None,
    active: Optional[bool] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.EuroMEP)
    if term:
        query = query.filter(models.EuroMEP.term == term)
    if active is not None:
        query = query.filter(models.EuroMEP.active == active)
    return query.all()
