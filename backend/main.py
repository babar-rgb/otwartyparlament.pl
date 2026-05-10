from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Date, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import List, Optional
from datetime import date

# --- KONFIGURACJA BAZY ---
DB_URL = "sqlite:///./backend/truth_layer.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MINIMALISTYCZNE MODELE ---

class MP(Base):
    __tablename__ = "mps"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    club = Column(String, index=True)
    photo_url = Column(String)
    active = Column(Boolean, default=True)

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    title_clean = Column(String)
    topic = Column(String, index=True)
    verdict = Column(String)
    importance = Column(Integer, default=5)
    details_json = Column(JSON) # { "yes": 120, "no": 80 }
    is_procedural = Column(Boolean, default=False)

class Headline(Base):
    __tablename__ = "headlines"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    portal = Column(String)
    url = Column(String)
    published_at = Column(Date)

# Tworzymy tabele
Base.metadata.create_all(bind=engine)

# --- API ---
app = FastAPI(title="Truth Layer - New Era")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/mps")
def get_mps(active: bool = True, db: Session = Depends(get_db)):
    return db.query(MP).filter(MP.active == active).all()

@app.get("/api/votes")
def get_votes(limit: int = 20, db: Session = Depends(get_db)):
    # Na początek zwracamy najnowsze
    return db.query(Vote).order_by(Vote.date.desc()).limit(limit).all()

@app.get("/api/trending")
def get_trending(db: Session = Depends(get_db)):
    # Prosta logika trendów: grupujemy nagłówki po słowach kluczowych
    topics = {
        "Ukraina": ["ukrain", "kijów", "wojn", "front"],
        "Gospodarka": ["ceny", "inflacja", "pkb", "podatki"],
        "Sądownictwo": ["sąd", "trybunał", "krs", "bodnar"],
        "Bezpieczeństwo": ["wojsko", "nato", "armia", "obrona"]
    }
    
    headlines = db.query(Headline).all()
    results = []
    
    for topic, keywords in topics.items():
        matched = [h.title for h in headlines if any(k in h.title.lower() for k in keywords)]
        portals = {h.portal for h in headlines if any(k in h.title.lower() for k in keywords)}
        
        if matched:
            results.append({
                "topic": topic,
                "portals_count": len(portals),
                "sample_headlines": matched[:3]
            })
    
    return sorted(results, key=lambda x: x["portals_count"], reverse=True)

@app.get("/")
def root():
    return {"status": "New Lean Backend is Live"}
