"""
Semantic Search API endpoints
"""

from fastapi import APIRouter, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import google.generativeai as genai
from sqlalchemy import text
import os

from backend.core.orm_db import get_db

router = APIRouter(prefix="/semantic", tags=["semantic"])

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class SearchResult(BaseModel):
    id: int
    type: str  # 'vote', 'bill', 'interpellation'
    title: str
    description: Optional[str]
    similarity: float
    url: str


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    total: int


@router.get("/search", response_model=SemanticSearchResponse)
async def semantic_search(
    q: str = Query(..., min_length=3, description="Search query"),
    limit: int = Query(50, ge=1, le=200),  # Increased from 20 to 50, max 200
    types: Optional[str] = Query(None, description="Comma-separated types: vote,bill,interpellation"),
    db: Session = Depends(get_db)
):
    """
    Semantic search across votes, bills, and interpellations
    
    Example: /semantic/search?q=podatki dla firm&limit=50&types=vote,bill
    """
    
    if not GEMINI_API_KEY:
        return SemanticSearchResponse(
            query=q,
            results=[],
            total=0
        )
    
    # db = next(get_db()) # Moved to Depends
    
    try:
        # Check cache first
        cached = db.execute(text("""
            SELECT embedding FROM query_embeddings 
            WHERE query = :query
        """), {"query": q.lower()}).fetchone()
        
        if cached and cached[0]:
            # Use cached embedding (FREE!)
            query_embedding = cached[0]
            embedding_str = str(query_embedding)
            
            # Update search count
            db.execute(text("""
                UPDATE query_embeddings 
                SET search_count = search_count + 1,
                    last_searched_at = NOW()
                WHERE query = :query
            """), {"query": q.lower()})
            db.commit()
        else:
            # Generate new embedding (costs API call)
            result = genai.embed_content(
                model="models/gemini-embedding-001",
                content=q,
                task_type="retrieval_query"
            )
            query_embedding = result['embedding']
            embedding_str = str(query_embedding)
            
            # Save to cache for future use
            try:
                db.execute(text("""
                    INSERT INTO query_embeddings (query, embedding, search_count, last_searched_at)
                    VALUES (:query, CAST(:embedding AS vector), 1, NOW())
                    ON CONFLICT (query) DO UPDATE 
                    SET search_count = query_embeddings.search_count + 1,
                        last_searched_at = NOW()
                """), {"query": q.lower(), "embedding": embedding_str})
                db.commit()
            except:
                pass  # Ignore cache save errors
        
        # Parse types filter
        search_types = []
        if types:
            search_types = [t.strip() for t in types.split(',')]
        else:
            search_types = ['vote', 'bill', 'interpellation', 'speech']
        
        results = []
        query_like = f"%{q}%"
        
        # Search votes - get more results per type
        if 'vote' in search_types:
            votes = db.execute(text("""
                SELECT 
                    id,
                    title_clean as title,
                    description,
                    CASE 
                        WHEN unaccent(title_clean) ILIKE unaccent(:query_like) THEN 1.0 
                        WHEN vector_embedding IS NULL THEN 0.0
                        ELSE 1 - (vector_embedding <=> CAST(:embedding AS vector)) 
                    END as similarity
                FROM votes
                WHERE vector_embedding IS NOT NULL OR unaccent(title_clean) ILIKE unaccent(:query_like)
                ORDER BY similarity DESC
                LIMIT :limit
            """), {"embedding": embedding_str, "limit": limit * 2, "query_like": query_like}).fetchall()  # Get 2x limit
            
            for vote in votes:
                if vote[3] > 0.3:  # Only include if similarity > 30% (lowered from 50%)
                    results.append(SearchResult(
                        id=vote[0],
                        type='vote',
                        title=vote[1] or 'Brak tytułu',
                        description=vote[2],
                        similarity=float(vote[3]),
                        url=f"/glosowania/{vote[0]}"
                    ))
        
        # Search bills
        if 'bill' in search_types:
            bills = db.execute(text("""
                SELECT 
                    id,
                    title,
                    SUBSTRING(content, 1, 200) as description,
                    CASE 
                        WHEN unaccent(title) ILIKE unaccent(:query_like) THEN 1.0 
                        WHEN vector_embedding IS NULL THEN 0.0
                        ELSE 1 - (vector_embedding <=> CAST(:embedding AS vector)) 
                    END as similarity
                FROM bills
                WHERE vector_embedding IS NOT NULL OR unaccent(title) ILIKE unaccent(:query_like)
                ORDER BY similarity DESC
                LIMIT :limit
            """), {"embedding": embedding_str, "limit": limit * 2, "query_like": query_like}).fetchall()
            
            for bill in bills:
                if bill[3] > 0.3:
                    results.append(SearchResult(
                        id=bill[0],
                        type='bill',
                        title=bill[1] or 'Brak tytułu',
                        description=bill[2],
                        similarity=float(bill[3]),
                        url=f"/projekty/{bill[0]}"
                    ))
        
        # Search interpellations
        if 'interpellation' in search_types:
            interps = db.execute(text("""
                SELECT 
                    id,
                    title,
                    SUBSTRING(content, 1, 200) as description,
                    CASE 
                        WHEN unaccent(title) ILIKE unaccent(:query_like) THEN 1.0 
                        WHEN vector_embedding IS NULL THEN 0.0
                        ELSE 1 - (vector_embedding <=> CAST(:embedding AS vector)) 
                    END as similarity
                FROM interpellations
                WHERE vector_embedding IS NOT NULL OR unaccent(title) ILIKE unaccent(:query_like)
                ORDER BY similarity DESC
                LIMIT :limit
            """), {"embedding": embedding_str, "limit": limit * 2, "query_like": query_like}).fetchall()
            
            for interp in interps:
                if interp[3] > 0.3:
                    results.append(SearchResult(
                        id=interp[0],
                        type='interpellation',
                        title=interp[1] or 'Brak tytułu',
                        description=interp[2],
                        similarity=float(interp[3]),
                        url=f"/interpelacje/{interp[0]}"
                    ))

        # Search speeches
        if 'speech' in search_types:
            speeches = db.execute(text("""
                SELECT 
                    id,
                    topic,
                    SUBSTRING(content, 1, 200) as description,
                    1 - (vector_embedding <=> CAST(:embedding AS vector)) as similarity,
                    speaker_name,
                    date
                FROM speeches
                WHERE vector_embedding IS NOT NULL
                ORDER BY vector_embedding <=> CAST(:embedding AS vector)
                LIMIT :limit
            """), {"embedding": embedding_str, "limit": limit * 2}).fetchall()
            
            for speech in speeches:
                if speech[3] > 0.3:
                    title = f"Wypowiedź: {speech[4]}"
                    if speech[1]:
                        title += f" - {speech[1]}"
                    
                    results.append(SearchResult(
                        id=speech[0],
                        type='speech',
                        title=title,
                        description=f"{speech[5]}: {speech[2]}...",
                        similarity=float(speech[3]),
                        url=f"/wypowiedzi/{speech[0]}" # Frontend routing needs to support this
                    ))
        
        # Sort by similarity and limit
        results.sort(key=lambda x: x.similarity, reverse=True)
        results = results[:limit]
        
        return SemanticSearchResponse(
            query=q,
            results=results,
            total=len(results)
        )
        
    except Exception as e:
        print(f"Semantic search error: {e}")
        return SemanticSearchResponse(
            query=q,
            results=[],
            total=0
        )


@router.get("/similar/{type}/{id}")
async def find_similar(
    type: str,
    id: int,
    limit: int = Query(10, ge=1, le=50)
):
    """
    Find similar items to a given vote/bill/interpellation
    
    Example: /semantic/similar/vote/12345?limit=10
    """
    
    db = next(get_db())
    
    # Map type to table
    table_map = {
        'vote': 'votes',
        'bill': 'bills',
        'interpellation': 'interpellations',
        'speech': 'speeches'
    }
    
    if type not in table_map:
        return {"error": "Invalid type"}
    
    table = table_map[type]
    
    try:
        # Get embedding of source item
        source = db.execute(text(f"""
            SELECT vector_embedding
            FROM {table}
            WHERE id = :id
        """), {"id": id}).fetchone()
        
        if not source or not source[0]:
            return {"error": "Item not found or no embedding"}
        
        embedding_str = str(source[0])
        
        # Find similar items
        similar = db.execute(text(f"""
            SELECT 
                id,
                CASE 
                    WHEN :type = 'vote' THEN title_clean 
                    WHEN :type = 'speech' THEN topic 
                    ELSE title 
                END as title,
                1 - (vector_embedding <=> CAST(:embedding AS vector)) as similarity
            FROM {table}
            WHERE id != :id
            AND vector_embedding IS NOT NULL
            ORDER BY vector_embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
        """), {"embedding": embedding_str, "id": id, "limit": limit}).fetchall()
        
        results = []
        for item in similar:
            results.append({
                "id": item[0],
                "title": item[1],
                "similarity": float(item[2]),
                "url": f"/{type}s/{item[0]}" if type != 'interpellation' else f"/interpelacje/{item[0]}"
            })
        
        return {
            "source_id": id,
            "source_type": type,
            "similar": results,
            "total": len(results)
        }
        
    except Exception as e:
        print(f"Find similar error: {e}")
        return {"error": str(e)}
