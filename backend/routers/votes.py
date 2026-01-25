from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from backend import models
from backend.core import orm_db as database

router = APIRouter()

from sqlalchemy import exists

@router.get("")
def read_votes(
    skip: int = 0, 
    limit: int = 100, 
    term: Optional[int] = None,
    sitting: Optional[int] = None,
    voting_number: Optional[int] = None,
    mp_id: Optional[int] = None,
    print_number: Optional[str] = None,
    has_results: Optional[bool] = None,
    rebellion: Optional[bool] = None,
    # New filters
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    verdict: Optional[str] = None,
    q: Optional[str] = None,
    category: Optional[str] = None, # LAWS, RESOLUTIONS, PERSONAL, PROCEDURAL
    hide_procedural: bool = False,
    grouped: bool = False,
    db: Session = Depends(database.get_db)
):
    from sqlalchemy.orm import defer, subqueryload
    query = db.query(models.Vote).options(
        defer(models.Vote.vector_embedding),
        defer(models.Vote.search_vector),
        subqueryload(models.Vote.children)
    )
    # Semantic Search Logic
    if q:
        from backend.services.embedding import embedding_service
        # We need to temporarily instantiate model here or use service if available.
        # For Simplicity (Blitz), we assume embedding_service works or we failover to text.
        try:
            query_vector = embedding_service.get_embedding(q)
            if query_vector:
                query = query.order_by(models.Vote.vector_embedding.cosine_distance(query_vector))
            else:
                query = query.filter(models.Vote.title_raw.ilike(f"%{q}%"))
        except:
             query = query.filter(models.Vote.title_raw.ilike(f"%{q}%"))

    # Grouping & Clarity Logic
    if hide_procedural and category != 'PROCEDURAL': # Allow procedural if explicitly requested
        query = query.filter(models.Vote.is_procedural == False)
    if grouped:
        query = query.filter(models.Vote.parent_vote_id == None)

    if term is not None:
        query = query.filter(models.Vote.term == term)
    if sitting is not None:
        query = query.filter(models.Vote.sitting == sitting)
    if voting_number is not None:
        query = query.filter(models.Vote.voting_number == voting_number)
    
    # New Filter Logic
    if date_from:
        query = query.filter(models.Vote.date >= date_from)
    if date_to:
        query = query.filter(models.Vote.date <= date_to)
    if verdict:
        # Frontend might send 'Uchwalono', 'Odrzucono' etc.
        # DB stores exact strings. We use ilike for flexibility
        query = query.filter(models.Vote.verdict.ilike(f"%{verdict}%"))
        
    if category:
        from sqlalchemy import or_
        if category == 'LAWS':
            query = query.filter(or_(
                models.Vote.kind.ilike('%ustaw%'),
                models.Vote.title_raw.ilike('%o zmianie ustawy%'),
                models.Vote.title_raw.ilike('%projekt ustawy%'),
                models.Vote.title_clean.ilike('%ustawa%')
            ))
        elif category == 'RESOLUTIONS':
            query = query.filter(or_(
                models.Vote.kind.ilike('%uchwał%'),
                models.Vote.title_raw.ilike('%projekt uchwały%'),
                models.Vote.title_raw.ilike('%w sprawie uchwały%'),
                models.Vote.title_clean.ilike('%uchwała%')
            ))
        elif category == 'PERSONAL':
            query = query.filter(or_(
                models.Vote.topic.ilike('%wybór%'),
                models.Vote.topic.ilike('%powołan%'),
                models.Vote.topic.ilike('%odwołan%'),
                models.Vote.title_raw.ilike('%powołan%'),
                models.Vote.title_raw.ilike('%odwołan%'),
                models.Vote.title_raw.ilike('%wybór%'),
                models.Vote.title_clean.ilike('%powołanie%'),
                models.Vote.title_clean.ilike('%odwołanie%')
            ))
        elif category == 'PROCEDURAL':
            # Strict procedural filter (the flag OR keywords)
            query = query.filter(or_(
                models.Vote.is_procedural == True,
                models.Vote.title_raw.ilike('%porządek dzienny%'),
                models.Vote.title_raw.ilike('%przerw%'),
                models.Vote.title_raw.ilike('%odroczen%'),
                models.Vote.title_raw.ilike('%wniosek o%')
            ))

    if has_results is True:
        query = query.filter(exists().where(models.VoteResult.vote_id == models.Vote.id))

    
    if mp_id is not None:
        if rebellion:
            # Rebellious votes: MP result != Club Majority
            # We use a raw SQL approach for efficiency relative to the 'stats.py' logic
            from sqlalchemy import text
            
            # This query mimics stats.py:
            # 1. Finds consensus for the MP's club for each vote
            # 2. Compares MP's vote to consensus
            # 3. Returns filtering IDs
            # Note: We filter by term if provided to speed it up
            
            raw_sql = """
                WITH target_mp AS (
                    SELECT id, club, term FROM mps WHERE id = :mp_id
                ),
                vote_results_filtered AS (
                    SELECT vr.vote_id, vr.result, v.term
                    FROM vote_results vr
                    JOIN votes v ON vr.vote_id = v.id
                    JOIN target_mp t ON vr.mp_id = t.id
                    WHERE v.term = t.term
                ),
                club_votes AS (
                    SELECT vr.vote_id, vr.result, count(*) as cnt
                    FROM vote_results vr
                    JOIN mps m ON vr.mp_id = m.id
                    JOIN target_mp t ON m.club = t.club
                    JOIN votes v ON vr.vote_id = v.id
                    WHERE v.term = t.term
                    GROUP BY vr.vote_id, vr.result
                ),
                club_winners AS (
                    SELECT DISTINCT ON (vote_id) vote_id, result as majority_result
                    FROM club_votes
                    ORDER BY vote_id, cnt DESC
                )
                SELECT vrf.vote_id
                FROM vote_results_filtered vrf
                JOIN club_winners cw ON vrf.vote_id = cw.vote_id
                WHERE vrf.result != cw.majority_result
                  AND vrf.result IN ('YES', 'NO', 'ABSTAIN')
                  AND cw.majority_result IN ('YES', 'NO', 'ABSTAIN')
            """
            
            rebel_vote_ids = db.execute(text(raw_sql), {"mp_id": mp_id}).fetchall()
            rebel_ids_list = [r[0] for r in rebel_vote_ids]
            
            # Apply filter
            if not rebel_ids_list:
                # No rebellions found, return empty result strictly
                query = query.filter(models.Vote.id == -1) 
            else:
                query = query.filter(models.Vote.id.in_(rebel_ids_list))
        
        # Join with results to get only votes where this MP participated and was not absent
        # We also need to select the result to return it
        query = query.join(models.VoteResult).filter(
            models.VoteResult.mp_id == mp_id
        ).add_columns(models.VoteResult.result)
    
    # Calculate total count based on filters (but before pagination)
    total = query.count()
    
    # Execute query with pagination and ordering
    if mp_id is not None:
        # results will be a list of tuples (Vote, result)
        results = query.order_by(models.Vote.date.desc(), models.Vote.voting_number.desc()).offset(skip).limit(limit).all()
        
        final_items = []
        for vote, result in results:
            vote_dict = {}
            for c in vote.__table__.columns:
                if c.name not in ['vector_embedding', 'search_vector']:
                    value = getattr(vote, c.name)
                    # Convert Date objects to string
                    if hasattr(value, 'isoformat'):
                        vote_dict[c.name] = value.isoformat()
                    else:
                        vote_dict[c.name] = value
            vote_dict['mp_vote'] = result
            final_items.append(vote_dict)
            
        return {
            "items": final_items,
            "total": total
        }
    else:
        # Standard case, results are Vote objects
        results = query.order_by(models.Vote.date.desc(), models.Vote.voting_number.desc()).offset(skip).limit(limit).all()
        
        final_items = []
        for vote in results:
            # Exclude vector_embedding and search_vector from serialization
            vote_dict = {}
            for c in vote.__table__.columns:
                if c.name in ['vector_embedding', 'search_vector']:
                    continue
                    
                value = getattr(vote, c.name)
                # Convert Date objects to string
                if hasattr(value, 'isoformat'):
                    vote_dict[c.name] = value.isoformat()
                else:
                    vote_dict[c.name] = value
            
            # Grouping Info
            if grouped:
                vote_dict['child_count'] = len(vote.children)
            else:
                vote_dict['child_count'] = 0

            final_items.append(vote_dict)
            
        return {
            "items": final_items,
            "total": total
        }

@router.get("/results")
def read_votes_results_v2(
    mp_id: Optional[int] = Query(None),
    vote_id: Optional[int] = Query(None),
    mp_ids: Optional[List[int]] = Query(None),
    limit: int = 1000,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.VoteResult)
    if mp_id:
        query = query.filter(models.VoteResult.mp_id == mp_id)
    if vote_id:
        query = query.filter(models.VoteResult.vote_id == vote_id)
    if mp_ids:
        query = query.filter(models.VoteResult.mp_id.in_(mp_ids))
    
    # Eager load the MP relationship to avoid N+1 queries
    results = query.order_by(models.VoteResult.vote_id.desc()).options(joinedload(models.VoteResult.mp)).limit(limit).all()
    
    out = []
    for r in results:
        mp = r.mp
        out.append({
            "mp_id": r.mp_id,
            "vote_id": r.vote_id,
            "vote": r.result,
            "mp_first_name": mp.first_name if mp else "Unknown",
            "mp_last_name": mp.last_name if mp else "Unknown",
            "mp_club": mp.club if mp else "Unknown",
            "mp_options": "N/A" # Placeholder if needed, but not modifying model now
        })
    return out

@router.get("/{vote_id}")
def read_vote(vote_id: int, db: Session = Depends(database.get_db)):
    # Defer vector loading
    from sqlalchemy.orm import defer
    vote = db.query(models.Vote).filter(models.Vote.id == vote_id)\
        .options(joinedload(models.Vote.analysis), defer(models.Vote.vector_embedding), defer(models.Vote.search_vector))\
        .first()
    if vote is None:
        raise HTTPException(status_code=404, detail="Vote not found")
    vote_dict = {c.name: getattr(vote, c.name) for c in vote.__table__.columns if c.name not in ['vector_embedding', 'search_vector']}
    # Add analysis if loaded
    if vote.analysis:
        vote_dict['analysis'] = {c.name: getattr(vote.analysis, c.name) for c in vote.analysis.__table__.columns}
    else:
        vote_dict['analysis'] = None
        
    return vote_dict

@router.get("/{vote_id}/analysis")
def read_vote_analysis(vote_id: int, db: Session = Depends(database.get_db)):
    analysis = db.query(models.VoteAnalysis).filter(models.VoteAnalysis.vote_id == vote_id).first()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.get("/{vote_id}/results")
def read_vote_results(vote_id: int, db: Session = Depends(database.get_db)):
    results = db.query(models.VoteResult).filter(models.VoteResult.vote_id == vote_id).options(joinedload(models.VoteResult.mp)).all()
    return results

@router.post("/{vote_id}/analyze")
def generate_vote_analysis(vote_id: int, db: Session = Depends(database.get_db)):
    # 1. Check if analysis already exists
    existing = db.query(models.VoteAnalysis).filter(models.VoteAnalysis.vote_id == vote_id).first()
    if existing:
        return existing

    # 2. Fetch vote data
    vote = db.query(models.Vote).filter(models.Vote.id == vote_id).first()
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")

    # 3. Call Ollama Service
    from backend.services.ollama import ollama_service
    from backend.models import Bill
    import re

    # Prepare context
    title = vote.title_clean or vote.title_raw
    context = f"Tytuł: {title}\nOpis: {vote.description or ''}"
    
    # Try to find print number in title for extra context
    match = re.search(r'druki? nr (\d+)', title, re.IGNORECASE)
    if match:
        print_nr = match.group(1)
        bill = db.query(Bill).filter(Bill.number == print_nr).first()
        if bill:
            context += f"\n\nPowiązany Projekt Ustawy (Druk {print_nr}): {bill.title}\nUzasadnienie projektu: {bill.description or ''}"

    analysis_data = ollama_service.analyze_vote(title, context)
    
    if not analysis_data:
        raise HTTPException(status_code=500, detail="AI Analysis failed")

    # 4. Save result
    analysis = models.VoteAnalysis(
        vote_id=vote.id,
        summary=analysis_data.get("summary"),
        pros=analysis_data.get("pros", []),
        cons=analysis_data.get("cons", []),
        mind_map=analysis_data.get("mind_map")
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    return analysis

@router.get("/{vote_id}/connections")
def read_vote_connections(vote_id: int, db: Session = Depends(database.get_db)):
    """
    Returns all connections for a vote: Unified Process, Related Bills/Prints, and Committee Sittings.
    """
    from backend.models import LegislativeStage, LegislativeProcess, Bill, CommitteeSitting
    from sqlalchemy import or_, cast, String
    
    # 1. Find the process via stage
    stage = db.query(LegislativeStage).filter(LegislativeStage.vote_id == vote_id).first()
    
    process = None
    if stage:
        process = db.query(LegislativeProcess).filter(LegislativeProcess.id == stage.process_id).first()
    
    if not process:
        # Fallback: maybe the vote title has a print number?
        vote = db.query(models.Vote).filter(models.Vote.id == vote_id).first()
        if vote:
            import re
            match = re.search(r'druk[iu]? nr (\d+)', (vote.title_raw or ""), re.IGNORECASE)
            if match:
                print_nr = match.group(1)
                stage = db.query(LegislativeStage).filter(LegislativeStage.bill_number == print_nr).first()
                if stage:
                    process = db.query(LegislativeProcess).filter(LegislativeProcess.id == stage.process_id).first()

    if not process:
        return {"process": None, "bills": [], "committees": []}

    # 2. Get all bills in this process
    all_stages = db.query(LegislativeStage).filter(LegislativeStage.process_id == process.id).all()
    bill_numbers = list(set([s.bill_number for s in all_stages if s.bill_number]))
    
    bills = []
    if bill_numbers:
        bills = db.query(Bill).filter(Bill.number.in_(bill_numbers)).all()

    # 3. Get committee sittings mentioning these bills
    committees = []
    if bill_numbers:
        # Search in JSONB agenda. We use the ->> operator or just cast to string for simplicity in a broad search
        # Or better: search for the bill number as part of the text in agenda
        search_clauses = [cast(CommitteeSitting.agenda, String).ilike(f"%druk%nr {bn}%") for bn in bill_numbers]
        committees = db.query(CommitteeSitting).filter(or_(*search_clauses)).order_by(CommitteeSitting.date.desc()).limit(10).all()

    return {
        "process": {
            "id": process.id,
            "title": process.title,
            "description": process.description,
            "status": process.status
        },
        "bills": [
            {"number": b.number, "title": b.title, "type": b.type, "status": b.status} for b in bills
        ],
        "committees": [
            {
                "id": c.id,
                "sitting_number": c.sitting_number,
                "date": c.date.isoformat() if c.date else None,
                "committee_code": c.committee_code,
                "summary": c.summary
            } for c in committees
        ]
    }

