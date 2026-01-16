from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, text
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
    from backend.services.embedding import embedding_service
    results = []
    
    # helper to check if we should search a specific type
    def should_search(t):
        return type is None or type == t
    
    # 1. Search across MPs (Traditional)
    if should_search('mp') and not period:
        # Postgres specific concat
        full_name_normal = func.concat(models.MP.first_name, ' ', models.MP.last_name)
        full_name_reverse = func.concat(models.MP.last_name, ' ', models.MP.first_name)
        
        mp_query = db.query(models.MP)
        if period:
             mp_query = mp_query.filter(models.MP.term == int(period))

        mps = mp_query.filter(
            or_(
                models.MP.first_name.ilike(f"%{q}%"),
                models.MP.last_name.ilike(f"%{q}%"),
                full_name_normal.ilike(f"%{q}%"),
                full_name_reverse.ilike(f"%{q}%")
            )
        ).limit(6).all()
        
        for mp in mps:
            mp_dict = {c.name: getattr(mp, c.name) for c in mp.__table__.columns}
            results.append({
                "type": "mp",
                "id": str(mp.id),
                "title": f"{mp.first_name} {mp.last_name}",
                "data": mp_dict
            })
    
    # 2. Search across Votes
    if should_search('vote'):
        # Base query
        vote_query = db.query(models.Vote)
        if q and len(q) > 3:
            # Semantic search with optional period filtering
            # Semantic search with optional period filtering
            # OPTIMIZATION PHASE 2: PGVECTOR NATIVE SEARCH
            query_vec = embedding_service.get_embedding(q)
            
            if query_vec:
                # Use pgvector cosine distance
                # Order by distance ASC (closest first)
                votes_q = db.query(models.Vote).filter(models.Vote.vector_embedding != None)
                
                if period:
                    votes_q = votes_q.filter(models.Vote.term == int(period))
                
                # NOISE FILTER: Exclude "Sprawy Regulaminowe" and "Posiedzenie Sejmu" unless user asks for it
                if "regulamin" not in q.lower() and "posiedzenie" not in q.lower():
                     votes_q = votes_q.filter(models.Vote.title_clean.notilike("%Sprawy Regulaminowe%"))
                     votes_q = votes_q.filter(models.Vote.title_clean.notilike("%Posiedzenie Sejmu%"))

                # HYBRID SORT: FTS Priority > Text Match > Semantic Relevance
                from sqlalchemy import case, literal, func
                
                # 1. Full Text Search Match (Morphology: ciąża = ciąży)
                # We use @@ operator with websearch_to_tsquery('polish', q)
                fts_match = models.Vote.search_vector.op('@@')(func.websearch_to_tsquery('polish', q))

                # 2. Simple Substring Match (Old school: "regul" matches "regulamin")
                title_ilike = models.Vote.title_clean.ilike(f"%{q}%")
                
                # Priority: FTS (0) -> ILIKE (1) -> Vector (2)
                rank_algo = case(
                    (fts_match, 0),
                    (title_ilike, 1),
                    else_=2
                )
                
                votes = votes_q.order_by(
                    rank_algo.asc(),
                    models.Vote.vector_embedding.cosine_distance(query_vec).asc()
                ).limit(20).all()
                    
                # Fallback Smart Ranking if needed, or trust vector distance
                # currently vector distance is primary.
            else:
                 votes = []
            
        else:
            # Fallback to simple ILIKE
            votes = vote_query.filter(models.Vote.title_clean.ilike(f"%{q}%")).order_by(models.Vote.importance.desc()).limit(20).all()

        for vote in votes:
            results.append({
                "type": "vote",
                "id": str(vote.id),
                "title": vote.title_clean,
                "date": str(vote.date),
                "term": vote.term,
                "topic": vote.topic,
                "ux_category": vote.kind or "Głosowanie",
                "sitting": vote.sitting,
                "voting_number": vote.voting_number
            })

    # 3. Search across Bills (Projekty)
    if should_search('process'):
        # Date logic for terms: Term 10 start > 2023-11-13
        bill_query = db.query(models.Bill)
        
        if period:
            p = int(period)
            if p == 10:
                bill_query = bill_query.filter(models.Bill.date >= '2023-11-13')
            elif p == 9:
                bill_query = bill_query.filter(models.Bill.date < '2023-11-13', models.Bill.date >= '2019-11-12')
        
        if q and len(q) > 3:
            # Semantic search for Bills
            # Semantic search for Bills
            # OPTIMIZATION PHASE 2: PGVECTOR NATIVE SEARCH
            query_vec = embedding_service.get_embedding(q)
            
            if query_vec:
                bills_q = db.query(models.Bill).filter(models.Bill.vector_embedding != None)
                
                if period:
                    p = int(period)
                    if p == 10:
                        bills_q = bills_q.filter(models.Bill.date >= '2023-11-13')
                    elif p == 9:
                        bills_q = bills_q.filter(models.Bill.date < '2023-11-13', models.Bill.date >= '2019-11-12')
                        
                bills = bills_q.order_by(models.Bill.vector_embedding.cosine_distance(query_vec))\
                    .limit(20).all()
            else:
                bills = []
            
            if not bills:
                 bills = bill_query.filter(
                    or_(
                        models.Bill.title.ilike(f"%{q}%"),
                        models.Bill.description.ilike(f"%{q}%"),
                        models.Bill.number == q
                    )
                ).limit(20).all()
        else:
            bills = bill_query.filter(
                or_(
                    models.Bill.title.ilike(f"%{q}%"),
                    models.Bill.description.ilike(f"%{q}%"),
                    models.Bill.number == q
                )
            ).limit(20).all()

        for bill in bills:
            # Infer term for display
            b_term = 10
            if bill.date and str(bill.date) < '2023-11-13':
                b_term = 9
                
            results.append({
                "type": "process",
                "id": str(bill.id),
                "title": f"Druk nr {bill.number}: {bill.title}",
                "date": str(bill.date),
                "term": b_term,
                "topic": bill.topic,
                "ux_category": bill.type or "Projekt"
            })

    # 4. Search across Speeches (Wypowiedzi) - Text Match
    if should_search('speech'):
        speech_query = db.query(models.Speech)
        if period:
            speech_query = speech_query.filter(models.Speech.term == int(period))
            
        speeches = speech_query.filter(
            models.Speech.content.ilike(f"%{q}%")
        ).limit(5).all()
        
        for s in speeches:
            results.append({
                "type": "speech",
                "id": str(s.id),
                "title": f"Wypowiedź: {s.speaker_name}",
                "date": str(s.date),
                "content_preview": s.content[:200] + "...",
                "term": s.term,
                "mp_id": str(s.mp_id)
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

@router.get("/interpellations/count")
def read_interpellations_count(db: Session = Depends(database.get_db)):
    count = db.query(models.Interpellation).count()
    return {"count": count}

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
    
    # Eager load authors
    interpellations = query.options(joinedload(models.Interpellation.authors))\
        .order_by(models.Interpellation.sent_date.desc()).offset(skip).limit(limit).all()
    
    final_items = []
    for i in interpellations:
        i_dict = {c.name: getattr(i, c.name) for c in i.__table__.columns}
        # Serialize authors
        i_dict['authors'] = [{c.name: getattr(a, c.name) for c in a.__table__.columns} for a in i.authors]
        final_items.append(i_dict)
        
    return final_items

@router.get("/interpellations/{id}")
def read_interpellation(id: int, db: Session = Depends(database.get_db)):
    interpellation = db.query(models.Interpellation).filter(models.Interpellation.id == id).first()
    if not interpellation:
        raise HTTPException(status_code=404, detail="Interpellation not found")
    
    # Manually serialize + add raw_data if needed
    i_dict = {c.name: getattr(interpellation, c.name) for c in interpellation.__table__.columns}
    
    # Get authors
    authors = db.query(models.MP).join(models.InterpellationAuthor).filter(models.InterpellationAuthor.interpellation_id == id).all()
    i_dict['authors'] = [{c.name: getattr(a, c.name) for c in a.__table__.columns} for a in authors]
    
    return i_dict

@router.get("/speeches/count")
def read_speeches_count(db: Session = Depends(database.get_db)):
    count = db.query(models.Speech).count()
    return {"count": count}

@router.get("/speeches/{id}")
def read_speech(id: int, db: Session = Depends(database.get_db)):
    speech = db.query(models.Speech).options(joinedload(models.Speech.mp)).filter(models.Speech.id == id).first()
    
    if not speech:
        raise HTTPException(status_code=404, detail="Speech not found")
        
    s_dict = {c.name: getattr(speech, c.name) for c in speech.__table__.columns}
    if speech.mp:
        s_dict['mp'] = {c.name: getattr(speech.mp, c.name) for c in speech.mp.__table__.columns}
        
    return s_dict

@router.get("/speeches")
def read_speeches(
    mp_id: Optional[int] = None,
    limit: int = 20,
    skip: int = 0,
    sitting: Optional[int] = None,
    term: Optional[int] = None,
    q: Optional[str] = None,
    party: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Speech)
    
    if mp_id:
        query = query.filter(models.Speech.mp_id == mp_id)
    if sitting:
        query = query.filter(models.Speech.sitting == sitting)
    if term:
        query = query.filter(models.Speech.term == term)
    
    # Advanced Filters
    if q:
        query = query.filter(models.Speech.content.ilike(f"%{q}%"))
    
    if date_from:
        query = query.filter(models.Speech.date >= date_from)
        
    if date_to:
        query = query.filter(models.Speech.date <= date_to)
        
    if party:
        query = query.join(models.MP).filter(models.MP.club == party)
        
    total = query.count()
    
    # Eager load MP to prevent N+1 and allow frontend display
    speeches = query.options(joinedload(models.Speech.mp))\
        .order_by(models.Speech.date.desc(), models.Speech.statement_num.asc())\
        .offset(skip).limit(limit).all()
    
    final_items = []
    for s in speeches:
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        if s.mp:
            s_dict['mp'] = {c.name: getattr(s.mp, c.name) for c in s.mp.__table__.columns}
        final_items.append(s_dict)
        
    return {
        "items": final_items,
        "total": total
    }
