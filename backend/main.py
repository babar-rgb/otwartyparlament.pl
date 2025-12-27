from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend import models
from backend.core import orm_db as database
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Sejm Open Parliament API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Sejm API"}

@app.get("/mps")
def read_mps(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    mps = db.query(models.MP).offset(skip).limit(limit).all()
    return mps

@app.get("/mps/{mp_id}")
def read_mp(mp_id: int, db: Session = Depends(database.get_db)):
    mp = db.query(models.MP).filter(models.MP.id == mp_id).first()
    if mp is None:
        raise HTTPException(status_code=404, detail="MP not found")
    return mp

@app.get("/votes")
def read_votes(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    votes = db.query(models.Vote).offset(skip).limit(limit).all()
    return votes

@app.get("/votes/{vote_id}")
def read_vote(vote_id: int, db: Session = Depends(database.get_db)):
    vote = db.query(models.Vote).filter(models.Vote.id == vote_id).first()
    if vote is None:
        raise HTTPException(status_code=404, detail="Vote not found")
    return vote
