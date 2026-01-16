from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import json

from backend.core.orm_db import get_db
from backend.models import Vote, VoteAnalysis

router = APIRouter()

@router.get("/feed", tags=["Personas"])
def get_persona_feed(
    persona: str,
    term: int = 10,
    limit: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get a personalized feed of votes for a specific persona (e.g. 'Rolnik', 'Student').
    Filters out votes with 'Brak wpływu'.
    """
    
    # 1. Fetch recent votes with analysis
    # Optimization: specific LIKE query for the persona key to filter at DB level 
    # (though 'mind_map' is text, so we check for existence of key first)
    votes = db.query(Vote).join(VoteAnalysis).filter(
        Vote.term == term,
        VoteAnalysis.mind_map.contains(persona) # Search for simple string match first
    ).order_by(Vote.date.desc(), Vote.importance.desc()).limit(limit * 3).all() 
    # Fetch more than limit because we will filter in Python
    
    results = []
    
    for vote in votes:
        if not vote.analysis or not vote.analysis.mind_map:
            continue
            
        try:
            personas_json = json.loads(vote.analysis.mind_map)
            impact_text = personas_json.get(persona)
            
            # Simple heuristic to filter out "No impact"
            if not impact_text or len(impact_text) < 5:
                continue
                
            skip_phrases = ["brak wpływu", "brak bezpośredniego wpływu", "nie dotyczy", "brak istotnego wpływu"]
            if any(phrase in impact_text.lower() for phrase in skip_phrases):
                continue
                
            # It's relevant!
            results.append({
                "vote_id": vote.id,
                "title": vote.title_clean,
                "date": vote.date,
                "importance": vote.importance,
                "impact_text": impact_text,
                "summary": vote.analysis.summary
            })
            
            if len(results) >= limit:
                break
                
        except json.JSONDecodeError:
            continue
            
    return results
