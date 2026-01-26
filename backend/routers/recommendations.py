from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, text
from typing import List, Optional
import google.generativeai as genai
import os
import json

from backend.core.orm_db import get_db
from backend import models

router = APIRouter()

@router.get("/recommendations", tags=["Personalization"])
def get_recommendations(
    interests: str, # Comma separated list of interests or a short sentence
    db: Session = Depends(get_db)
):
    """
    Get语义 (semantic) recommendations based on user interests.
    Uses embeddings to find relevant votes, interpellations and bills.
    """
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        return {"error": "API Key not configured"}

    genai.configure(api_key=GEMINI_API_KEY)
    
    # 1. Get embedding for the interests
    try:
        # Check cache first (reuse QueryEmbedding table)
        cached = db.query(models.QueryEmbedding).filter(models.QueryEmbedding.query == interests.lower()).first()
        if cached:
            interest_emb = cached.embedding
        else:
            res = genai.embed_content(
                model="models/text-embedding-004",
                content=interests,
                task_type="retrieval_query"
            )
            interest_emb = res['embedding']
            # Optional: save to cache
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    # 2. Search Votes
    votes = db.query(models.Vote).filter(models.Vote.vector_embedding.isnot(None))\
        .order_by(models.Vote.vector_embedding.cosine_distance(interest_emb))\
        .limit(10).all()
        
    # 3. Search Bills (Prints)
    bills = db.query(models.Bill).filter(models.Bill.vector_embedding.isnot(None))\
        .order_by(models.Bill.vector_embedding.cosine_distance(interest_emb))\
        .limit(5).all()

    # 4. Search Interpellations
    interpellations = db.query(models.Interpellation).filter(models.Interpellation.vector_embedding.isnot(None))\
        .order_by(models.Interpellation.vector_embedding.cosine_distance(interest_emb))\
        .limit(5).all()

    # Build results
    results = []
    
    for v in votes:
        results.append({
            "type": "vote",
            "id": v.id,
            "title": v.title_clean,
            "date": v.date.isoformat() if v.date else None,
            "score": v.importance or 5,
            "category": v.topic
        })
        
    for b in bills:
        results.append({
            "type": "bill",
            "id": b.id,
            "title": f"Druk {b.number}: {b.title}",
            "date": b.date.isoformat() if b.date else None,
            "score": 7,
            "category": b.topic
        })
        
    for i in interpellations:
        results.append({
            "type": "interpellation",
            "id": i.id,
            "title": i.title,
            "date": i.date.isoformat() if i.date else None,
            "score": 4,
            "category": "Interpelacja"
        })

    # Sort by date (desc)
    results.sort(key=lambda x: x.get('date') or "", reverse=True)
    
    return results
