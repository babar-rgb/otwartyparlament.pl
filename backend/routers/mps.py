import sys, os; sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sys, os; sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from backend import models
from backend.core import orm_db as database
from sqlalchemy import or_

router = APIRouter()

@router.get("", response_model=List[models.MP] if hasattr(models, 'MPSchema') else None)
@router.get("", response_model=List[models.MP] if hasattr(models, 'MPSchema') else None)
def read_mps(
    skip: int = 0, 
    limit: int = 1000, 
    term: Optional[int] = None,
    active: Optional[bool] = None,
    light: bool = False,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.MP)
    if term is not None:
        query = query.filter(models.MP.term == term)
    if active is not None:
        if active:
            query = query.filter(or_(models.MP.active, models.MP.active.is_(None)))
        else:
            query = query.filter(not models.MP.active)
    
    mps = query.order_by(models.MP.last_name.asc()).offset(skip).limit(limit).all()
    
    final_items = []
    # If light mode, return only essential fields for list views
    light_fields = {'id', 'first_name', 'last_name', 'club', 'photo_url', 'slug', 'active', 'term'}
    
    for m in mps:
        if light:
            m_dict = {field: getattr(m, field) for field in light_fields}
        else:
            m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
        final_items.append(m_dict)
        
    return final_items

@router.get("/asset_declarations")
def read_asset_declarations(db: Session = Depends(database.get_db)):
    # Simple list of recent declarations
    declarations = db.query(models.AssetDeclaration).order_by(models.AssetDeclaration.year.desc()).limit(100).all()
    
    final_items = []
    for d in declarations:
        d_dict = {c.name: getattr(d, c.name) for c in d.__table__.columns}
        final_items.append(d_dict)
        
    return final_items

@router.get("/{id_or_slug}")
def read_mp(id_or_slug: str, db: Session = Depends(database.get_db)):
    # Try ID first if it's a number
    if id_or_slug.isdigit():
        mp = db.query(models.MP).filter(models.MP.id == int(id_or_slug)).first()
    else:
        # Try Slug
        mp = db.query(models.MP).filter(models.MP.slug == id_or_slug).first()
        
    if mp is None:
        raise HTTPException(status_code=404, detail="MP not found")
    
    return {c.name: getattr(mp, c.name) for c in mp.__table__.columns}

@router.get("/{mp_id}/alignment")
def read_mp_alignment(mp_id: int, db: Session = Depends(database.get_db)):
    # Join with MP table to get details of the related person (mp_b)
    results = db.query(models.MPRelation, models.MP).join(models.MP, models.MPRelation.mp_id_b == models.MP.id).filter(models.MPRelation.mp_id_a == mp_id).all()
    
    final_items = []
    for relation, mp_b in results:
        r_dict = {c.name: getattr(relation, c.name) for c in relation.__table__.columns}
        # Add MP details flattened or nested
        r_dict["mp_target"] = {
            "id": mp_b.id,
            "first_name": mp_b.first_name,
            "last_name": mp_b.last_name,
            "club": mp_b.club,
            "photo_url": mp_b.photo_url
        }
        final_items.append(r_dict)
        
    return final_items

@router.get("/{mp_id}/stats")
def read_mp_stats(mp_id: int, db: Session = Depends(database.get_db)):
    stats = db.query(models.MPStat).filter(models.MPStat.mp_id == mp_id).all()
    return {s.stat_key: s.stat_value for s in stats}

@router.get("/{mp_id}/declarations")
def read_mp_declarations(mp_id: int, db: Session = Depends(database.get_db)):
    declarations = db.query(models.AssetDeclaration).filter(models.AssetDeclaration.mp_id == mp_id).order_by(models.AssetDeclaration.year.desc()).all()
    return [{c.name: getattr(d, c.name) for c in d.__table__.columns} for d in declarations]

@router.get("/{mp_id}/topic-activity")
def read_mp_topic_activity(mp_id: int, db: Session = Depends(database.get_db)):
    from sqlalchemy import text
    sql = """
        SELECT mt.slug, mt.title, mt.emoji, mt.category, count(vr.vote_id) as vote_count
        FROM vote_results vr
        JOIN vote_meta_topics vmt ON vr.vote_id = vmt.vote_id
        JOIN meta_topics mt ON vmt.meta_topic_id = mt.id
        WHERE vr.mp_id = :mp_id AND vr.result IN ('YES', 'NO', 'ABSTAIN')
        GROUP BY mt.slug, mt.title, mt.emoji, mt.category
        ORDER BY vote_count DESC
        LIMIT 10
    """
    rows = db.execute(text(sql), {"mp_id": mp_id}).fetchall()
    return [
        {
            "slug": r.slug,
            "title": r.title,
            "emoji": r.emoji,
            "category": r.category,
            "vote_count": r.vote_count
        } for r in rows
    ]

@router.get("/{mp_id}/club-history")
def read_mp_club_history(mp_id: int, db: Session = Depends(database.get_db)):
    # Try by ID or Slug for convenience
    mp = None
    if str(mp_id).isdigit():
        mp = db.query(models.MP).filter(models.MP.id == int(mp_id)).first()
    
    if not mp:
        raise HTTPException(status_code=404, detail="MP not found")
        
    return mp.club_history or []
