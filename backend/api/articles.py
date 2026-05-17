# articles.py — Router FastAPI dla artykułów.
# Wzorzec identyczny jak api/mps.py i api/votes.py.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.core.database import get_db
from backend.models.article import Article

router = APIRouter()


@router.get("/", response_model=List[dict])
def read_articles(db: Session = Depends(get_db)):
    articles = db.query(Article).all()
    return [
        {
            "id": a.slug,           # Frontend używa slug jako id (np. 'border-law')
            "slug": a.slug,
            "category": a.category,
            "date": a.date,
            "title": a.title,
            "excerpt": a.excerpt,
            "image": a.image,
            "votes_yes": a.votes_yes,
            "votes_no": a.votes_no,
            "verdict": a.verdict,
            "results_json": a.results_json or []
        }
        for a in articles
    ]


@router.get("/{slug}")
def read_article(slug: str, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.slug == slug).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return {
        "id": article.slug,
        "slug": article.slug,
        "category": article.category,
        "date": article.date,
        "title": article.title,
        "excerpt": article.excerpt,
        "image": article.image,
        "votes_yes": article.votes_yes,
        "votes_no": article.votes_no,
        "verdict": article.verdict,
        "results_json": article.results_json or []
    }
