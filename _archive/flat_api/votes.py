import sys, os; sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sys, os; sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from sqlalchemy import case
import models
from backend.core import orm_db as database

router = APIRouter()

from sqlalchemy import exists

@router.get("/timeline")
def get_vote_timeline(
    term: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    from sqlalchemy import func
    
    # query: sitting, date, count, adopted, rejected
    # We group by sitting. Date can be min(date) for that sitting.
    
    query = db.query(
        models.Vote.sitting,
        func.min(models.Vote.date).label('date'),
        func.count(models.Vote.id).label('count'),
        func.sum(case((models.Vote.verdict == 'PRZYJĘTO', 1), else_=0)).label('adopted'),
        func.sum(case((models.Vote.verdict == 'ODRZUCONO', 1), else_=0)).label('rejected')
    )
    
    if term:
        query = query.filter(models.Vote.term == term)
        
    # Exclude procedural children from the main count? 
    # The plan says "Legislative Activity". 
    # If we show ALL votes, the bars will be huge for "spam" sittings.
    # Maybe it's better to show 'Main Votes' vs 'Procedural'?
    # For now, let's count ALL to show the "workload", or just parents?
    # Let's count ALL for "Activity", but maybe split them?
    # For now simple aggregation:
    
    rows = query.group_by(models.Vote.sitting).order_by(models.Vote.sitting).all()
    
    return [
        {
            "sitting": r.sitting,
            "date": r.date.isoformat() if r.date else None,
            "count": r.count,
            "adopted": r.adopted or 0,
            "rejected": r.rejected or 0
        } 
        for r in rows
    ]

@router.get("/topics")
def get_vote_topics(
    term: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    from sqlalchemy import func, desc
    
    query = db.query(
        models.Vote.topic, 
        func.count(models.Vote.id).label('count')
    )
    
    if term:
        query = query.filter(models.Vote.term == term)
        
    # Filter out null topics
    query = query.filter(models.Vote.topic is not None)
    
    # Filter out messy topics (merged strings)
    query = query.filter(~models.Vote.topic.contains(','))
    
    # Filter out duplicates/noise
    query = query.filter(models.Vote.topic.notin_(['Społeczne', 'Polityka Społeczna', 'Polityka społeczna']))

    rows = query.group_by(models.Vote.topic).order_by(desc('count')).all()
    
    return [
        {"topic": r.topic, "count": r.count}
        for r in rows
    ]

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
    vector_str: Optional[str] = Query(None, alias="vector"), # Expect comma-separated floats
    category: Optional[str] = None, # LAWS, RESOLUTIONS, PERSONAL, PROCEDURAL
    topic: Optional[str] = None,    # Specific topic from AI categorization
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

    # 1. Semantic Search (Hybrid Base)
    vector = None
    if vector_str:
        try:
            # Parse comma-separated string to floats
            vector = [float(x) for x in vector_str.split(',')]
            if len(vector) != 768: # Correct dimension for gemini-embedding-001
                vector = None
        except ValueError:
            pass # Invalid vector format, ignore

    # 2. Hybrid Search & SQL Pattern Prep
    # We always use keyword patterns if q is provided, for "Keyword Boost"
    keywords_patterns = []
    if q:
        # Synonyms Dictionary (Unified - Level 5 "Evergreen")
        POLITICAL_SYNONYMS = {
            'drożyzna': ['inflacja', 'ceny', 'vat', 'koszyk', 'akcyza', 'tarcza'],
            'podatki': ['danin', 'pit', 'cit', 'akcyza', 'kwota wolna', 'ryczałt'],
            'praca': ['zatrudnienie', 'bezrobocie', 'płaca', 'minimalna', 'umowa', 'kodeks pracy', 'zus', 'zasiłek'],
            'kredyt': ['hipoteka', 'bank', 'rata', 'oprocentowanie', 'frankowicz', 'pożyczka', 'nbp', 'mieszkani'],
            'kredyt 0': ['pierwsze mieszkanie', 'mieszkanie na start', 'wspieraniu budownictwa', 'bezpieczny kredyt', 'dopłaty'],
            'małpki': ['wychowaniu w trzeźwości', 'napojów alkoholowych', 'opakowaniach', 'alkohol'],
            'aborcja': ['ciąż', 'płód', 'terminacja', 'przerywanie'],
            'in vitro': ['leczenie niepłodności', 'zapłodnienie', 'procedury medycznej'],
            'weto': ['prezydent', 'odrzucenie', 'ponowne rozpatrzenie'],
            'ustawa łańcuchowa': ['ochrona zwierząt', 'na uwięzi', 'kojce', 'znęcanie się', 'dobrostan zwierząt', 'weto'],
        }
        
        search_terms = [q]
        q_lower = q.lower()
        for key, values in POLITICAL_SYNONYMS.items():
            if key in q_lower:
                search_terms.extend(values)
        
        # Limit terms to top 5 and prepare for ILIKE ANY
        # Use word boundaries if possible or just ensure no partial matches for short words
        unique_terms = list(set([q] + [t for t in search_terms if t and len(t) > 2]))[:5]
        
        # Precise matching: "rata" -> " rata " or "rata," or at end of sentence
        # Case insensitive regex or word boundary markers if DB supports it.
        # For now, we'll use a safer ILIKE pattern for longer words and exact for short ones
        # or just rely on the fact that most Polish words have suffixes.
        # "rata" is problematic because it's in "przetwarzania", "Ratajski" etc.
        # Use PostgreSQL Regex ~* for word boundaries: '\m' (start) and '\M' (end)
        patterns = []
        for t in unique_terms:
            if len(t) <= 4:
                # Short words need word boundaries to avoid false positives (e.g. "rata")
                patterns.append(rf'\m{t}') # Match at least start of word
            else:
                patterns.append(t)
        
        keywords_patterns = patterns

    if vector or keywords_patterns:
        from sqlalchemy import text
        # If we have vector OR keywords, we calculate similarity
        # 1.0 boost for keyword match, else cosine similarity
        str(vector) if vector else None
        
        # We use a subquery to calculate similarity and then filter/order in the main query
        # But for FastAPI routing, we prefer to keep it in the main query builder if possible.
        # Since read_votes uses a lot of dynamic filters, it's easier to use a CASE in the query
        
        from sqlalchemy import case, literal
        if vector:
            sim_expr = 1 - models.Vote.vector_embedding.cosine_distance(vector)
        else:
            sim_expr = literal(0.5) # Baseline for keyword-only search
            
        # Add similarity column
        if keywords_patterns:
            # PostgreSQL Regex matching: ~* is case-insensitive matches regex
            # We check if any pattern matches
            regex_pattern = '|'.join(keywords_patterns)
            query = query.add_columns(
                case(
                    (models.Vote.title_clean.op('~*')(regex_pattern), literal(1.0)),
                    else_=sim_expr
                ).label('similarity')
            )
            query = query.filter(
                (models.Vote.title_clean.op('~*')(regex_pattern)) | 
                (models.Vote.vector_embedding is not None if vector else False)
            )
            query = query.order_by(text("similarity DESC"))
        elif vector:
            query = query.add_columns(sim_expr.label('similarity'))
            query = query.order_by(text("similarity DESC"))
        # Legacy search block removed in favor of Hybrid Search above
        pass

    # Grouping & Clarity Logic
    if hide_procedural and category != 'PROCEDURAL':
        from sqlalchemy import or_, not_
        query = query.filter(not models.Vote.is_procedural)
        # Also exclude obvious technical noise that might not be flagged yet
        procedural_keywords = [
            '%posiedzenie Sejmu%', '%przerw%', '%odroczen%', 
            '%Głosowanie proceduralne%', '%wniosek o%', '%porządek dzienny%'
        ]
        for pattern in procedural_keywords:
            query = query.filter(not_(models.Vote.title_raw.ilike(pattern)))
        
        # Also hide sitting headers specifically
        query = query.filter(not_(models.Vote.street_title.ilike('%Nagłówek Posiedzenia%')))
    if grouped:
        query = query.filter(models.Vote.parent_vote_id is None)

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

    if topic:
        query = query.filter(models.Vote.topic == topic)

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
                models.Vote.is_procedural,
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
                # Serialize children for the frontend
                children_data = []
                for child in vote.children:
                    child_dict = {}
                    for c in child.__table__.columns:
                        if c.name in ['vector_embedding', 'search_vector']:
                            continue
                        val = getattr(child, c.name)
                        if hasattr(val, 'isoformat'):
                            child_dict[c.name] = val.isoformat()
                        else:
                            child_dict[c.name] = val
                    children_data.append(child_dict)
                vote_dict['children'] = children_data
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
    limit: int = 2000,
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

@router.get("/{id_or_slug}")
def read_vote(id_or_slug: str, db: Session = Depends(database.get_db)):
    # Defer vector loading
    from sqlalchemy.orm import defer
    
    if id_or_slug.isdigit():
        query = db.query(models.Vote).filter(models.Vote.id == int(id_or_slug))
    else:
        query = db.query(models.Vote).filter(models.Vote.slug == id_or_slug)
        
    vote = query.options(
        joinedload(models.Vote.analysis), 
        defer(models.Vote.vector_embedding), 
        defer(models.Vote.search_vector)
    ).first()
    
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

    # 3. Call Gemini Service
    from backend.services.gemini import gemini_service
    from backend.models import Bill
    import re

    # Prepare context
    title = vote.title_clean or vote.title_raw
    description = vote.meta_description or ""
    bill_content = ""
    
    # Try to find print number in title for extra context
    match = re.search(r'druki? nr (\d+)', title, re.IGNORECASE)
    if not match and vote.print_number:
        # Fallback to printer number if it's already in the DB
        bill = db.query(Bill).filter(Bill.number == vote.print_number).first()
    elif match:
        print_nr = match.group(1)
        bill = db.query(Bill).filter(Bill.number == print_nr).first()
    else:
        bill = None

    if bill:
        bill_content = bill.content or bill.description or ""

    # Expert Analysis (Stage 18 "Deep Intelligence")
    analysis_data = gemini_service.analyze_expert(title, description, bill_content, doc_type="vote")
    
    if not analysis_data:
        raise HTTPException(status_code=500, detail="Gemini AI Analysis failed")

    # 4. Save result
    if not existing:
        analysis = models.VoteAnalysis(
            vote_id=vote.id,
            summary=analysis_data.get("summary_citizen"),
            summary_expert=analysis_data.get("summary_expert"),
            pros=analysis_data.get("pros", []),
            cons=analysis_data.get("cons", []),
            analysis_metadata={
                "importance_score": analysis_data.get("importance_score"),
                "personas": analysis_data.get("personas")
            }
        )
        db.add(analysis)
    else:
        # Update existing
        existing.summary = analysis_data.get("summary_citizen")
        existing.summary_expert = analysis_data.get("summary_expert")
        existing.pros = analysis_data.get("pros", [])
        existing.cons = analysis_data.get("cons", [])
        existing.analysis_metadata = {
            "importance_score": analysis_data.get("importance_score"),
            "personas": analysis_data.get("personas")
        }
        analysis = existing

    # Mirror citizen summary to Vote table for fast listing (Stage 11/18)
    vote.ai_summary = analysis_data.get("summary_citizen")
    if analysis_data.get("importance_score"):
        vote.importance = analysis_data.get("importance_score")
    if analysis_data.get("category"):
        vote.topic = analysis_data.get("category")

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

@router.get("/{vote_id}/speeches")
def read_vote_speeches(vote_id: int, db: Session = Depends(database.get_db)):
    from sqlalchemy.orm import joinedload
    
    speeches = db.query(models.Speech).filter(
        models.Speech.related_vote_id == vote_id
    ).options(joinedload(models.Speech.mp)).order_by(models.Speech.statement_num).all()
    
    out = []
    for s in speeches:
        mp = s.mp
        out.append({
            "id": s.id,
            "mp_id": s.mp_id,
            "sitting": s.sitting,
            "date": s.date.isoformat() if s.date else None,
            "speaker_name": s.speaker_name,
            "content": s.content,
            "topic": s.topic,
            "statement_num": s.statement_num,
            "mp": {
                "id": mp.id,
                "name": f"{mp.first_name} {mp.last_name}",
                "party": mp.club,
                "photo_url": mp.photo_url
            } if mp else None
        })
    return out
