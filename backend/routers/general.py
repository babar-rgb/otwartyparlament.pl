from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from backend import models
from backend.core import orm_db as database

router = APIRouter()

@router.get("/search")
def search_all(
    q: str, 
    type: Optional[str] = None, 
    period: Optional[str] = None, 
    controversial: bool = False, 
    expanded: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    # This is a complex unified search. For now, we'll search basic entities.
    results = []
    
    # Simple search across MPs
    mps = db.query(models.MP).filter(
        or_(
            models.MP.first_name.ilike(f"%{q}%"),
            models.MP.last_name.ilike(f"%{q}%")
        )
    ).limit(6).all()
    
    # Simple search across Votes
    votes = db.query(models.Vote).filter(
        models.Vote.title_clean.ilike(f"%{q}%")
    ).limit(20).all()
    
    # Format results to match frontend SearchResult interface
    for mp in mps:
        mp_dict = {c.name: getattr(mp, c.name) for c in mp.__table__.columns}
        results.append({
            "type": "mp",
            "id": str(mp.id),
            "title": f"{mp.first_name} {mp.last_name}",
            "data": mp_dict
        })
        
    for vote in votes:
        results.append({
            "type": "vote",
            "id": str(vote.id),
            "title": vote.title_clean,
            "date": str(vote.date),
            "term": vote.term
        })
        
    return results

@router.get("/categories")
def read_categories(db: Session = Depends(database.get_db)):
    return db.query(models.Category).all()

@router.get("/categories/vote_counts")
def read_category_vote_counts(term: int = 10, db: Session = Depends(database.get_db)):
    from sqlalchemy import func
    
    # 1. Get counts by topic
    topic_counts = db.query(models.Vote.topic, func.count(models.Vote.id))\
        .filter(models.Vote.term == term)\
        .group_by(models.Vote.topic).all()
    
    # 2. Get all categories to map topic -> category_id
    categories = db.query(models.Category).all()
    
    name_to_id = {c.name_pl: c.id for c in categories}
    slug_to_id = {c.slug: c.id for c in categories}
    
    out = []
    for topic, count in topic_counts:
        if not topic:
            continue
            
        cat_id = name_to_id.get(topic) or slug_to_id.get(topic)
        
        if cat_id:
            out.append({
                "category_id": cat_id,
                "vote_count": count
            })
            
    return out

@router.get("/committees")
def read_committees(term: Optional[int] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Committee)
    if term is not None:
        query = query.filter(models.Committee.term == term)
    
    committees = query.all()
    results = []
    
    for c in committees:
        m_count = db.query(models.CommitteeMember).filter(models.CommitteeMember.committee_code == c.code).count()
        s_count = db.query(models.CommitteeSitting).filter(models.CommitteeSitting.committee_code == c.code).count()
        
        c_dict = {col.name: getattr(c, col.name) for col in c.__table__.columns}
        c_dict['member_count'] = m_count
        c_dict['sitting_count'] = s_count
        results.append(c_dict)
        
    return results

@router.get("/committees/{code}")
def read_committee(code: str, skip_sittings: int = 0, limit_sittings: int = 20, db: Session = Depends(database.get_db)):
    committee = db.query(models.Committee).filter(models.Committee.code == code).first()
    if committee is None:
        raise HTTPException(status_code=404, detail="Committee not found")
    
    members = db.query(models.CommitteeMember).filter(models.CommitteeMember.committee_code == code).all()
    for member in members:
        member.mp = db.query(models.MP).filter(models.MP.id == member.mp_id).first()
    
    sittings_query = db.query(models.CommitteeSitting).filter(models.CommitteeSitting.committee_code == code)
    total_sittings = sittings_query.count()
    sittings = sittings_query.order_by(models.CommitteeSitting.date.desc()).offset(skip_sittings).limit(limit_sittings).all()
    
    # Manual serialization
    committee_dict = {c.name: getattr(committee, c.name) for c in committee.__table__.columns}
    
    final_members = []
    for m in members:
        m_dict = {c.name: getattr(m, c.name) for c in m.__table__.columns}
        if m.mp:
            m_dict['mp'] = {c.name: getattr(m.mp, c.name) for c in m.mp.__table__.columns}
        final_members.append(m_dict)
        
    final_sittings = []
    for s in sittings:
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        final_sittings.append(s_dict)
        
    return {
        "committee": committee_dict,
        "members": final_members,
        "sittings": final_sittings,
        "total_sittings": total_sittings
    }

@router.get("/committees/sittings/{sitting_id}")
def read_committee_sitting(sitting_id: int, db: Session = Depends(database.get_db)):
    sitting = db.query(models.CommitteeSitting).filter(models.CommitteeSitting.id == sitting_id).first()
    if sitting is None:
        raise HTTPException(status_code=404, detail="Sitting not found")
    
    # Get the committee to display its name
    committee = db.query(models.Committee).filter(models.Committee.code == sitting.committee_code).first()
    
    s_dict = {c.name: getattr(sitting, c.name) for c in sitting.__table__.columns}
    if committee:
        s_dict['committee'] = {c.name: getattr(committee, c.name) for c in committee.__table__.columns}
        
    return s_dict

@router.get("/interpellations")
def read_interpellations(
    mp_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Interpellation)
    if mp_id:
        query = query.join(models.InterpellationAuthor).filter(models.InterpellationAuthor.mp_id == mp_id)
    
    interpellations = query.order_by(models.Interpellation.sent_date.desc()).offset(skip).limit(limit).all()
    
    final_items = []
    for i in interpellations:
        i_dict = {c.name: getattr(i, c.name) for c in i.__table__.columns}
        final_items.append(i_dict)
        
    return final_items

@router.get("/speeches")
def read_speeches(
    mp_id: Optional[int] = None,
    limit: int = 20,
    skip: int = 0,
    sitting: Optional[int] = None,
    term: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Speech)
    if mp_id:
        query = query.filter(models.Speech.mp_id == mp_id)
    if sitting:
        query = query.filter(models.Speech.sitting == sitting)
    if term:
        query = query.filter(models.Speech.term == term)
        
    total = query.count()
    speeches = query.order_by(models.Speech.date.desc(), models.Speech.statement_num.asc()).offset(skip).limit(limit).all()
    
    final_items = []
    for s in speeches:
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        final_items.append(s_dict)
        
    return {
        "items": final_items,
        "total": total
    }
