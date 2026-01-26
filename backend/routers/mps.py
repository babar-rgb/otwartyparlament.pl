from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from backend import models
from backend.core import orm_db as database

router = APIRouter()

@router.get("", response_model=List[models.MP] if hasattr(models, 'MPSchema') else None)
def read_mps(
    skip: int = 0, 
    limit: int = 100, 
    term: Optional[int] = None,
    active: Optional[bool] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.MP)
    if term is not None:
        query = query.filter(models.MP.term == term)
    if active is not None:
        query = query.filter(models.MP.active == active)
    
    mps = query.order_by(models.MP.last_name.asc()).offset(skip).limit(limit).all()
    
    final_items = []
    for m in mps:
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
