from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core import orm_db as database
from backend import models
from backend.services.embedding import embedding_service
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class MatchRequest(BaseModel):
    query: str
    limit_votes: int = 5

@router.post("/match")
def match_political_twin(request: MatchRequest, db: Session = Depends(database.get_db)):
    """
    Finds the most relevant votes based on user query and identifies 
    the political alignment that matches the user's interest.
    """
    # 1. Embed the user's query
    query_vector = embedding_service.get_embedding(request.query)
    if not query_vector:
        return {"error": "Could not process semantic query"}

    # 2. Find relevant votes in the database
    # For now, we search all votes with embeddings
    all_votes = db.query(models.Vote).filter(models.Vote.vector_embedding != None).all()
    
    related_votes = embedding_service.find_similar(query_vector, all_votes, limit=request.limit_votes)
    
    # 3. Analyze voting patterns
    # We aggregate voting results for these specific votes
    vote_ids = [v.id for v in related_votes]
    
    # Query for results of these votes
    from sqlalchemy import func
    results = db.query(
        models.MP.club,
        models.VoteResult.result,
        func.count(models.VoteResult.id)
    ).join(models.VoteResult).filter(
        models.VoteResult.vote_id.in_(vote_ids)
    ).group_by(
        models.MP.club,
        models.VoteResult.result
    ).all()

    # Aggregate by party
    party_stats = {}
    for club, result, count in results:
        if club not in party_stats:
            party_stats[club] = {"YES": 0, "NO": 0, "ABSTAIN": 0, "total": 0}
        
        party_stats[club][result] = count
        if result in ["YES", "NO", "ABSTAIN"]:
            party_stats[club]["total"] += count

    # Calculate alignment score (Initial: favoring 'YES' for relevant topics)
    alignment = []
    for club, stats in party_stats.items():
        if stats["total"] > 0:
            score = (stats["YES"] / stats["total"]) * 100
            alignment.append({
                "party": club,
                "score": round(score, 1),
                "votes_for": stats["YES"],
                "total_votes": stats["total"]
            })

    alignment.sort(key=lambda x: x["score"], reverse=True)

    return {
        "query": request.query,
        "matched_votes": [
            {"id": v.id, "title": v.title_clean, "date": str(v.date), "topic": v.topic} 
            for v in related_votes
        ],
        "alignment": alignment,
        "suggestion": "Te partie statystycznie najczęściej popierały ustawy z obszaru Twoich zainteresowań."
    }
