from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, text, case, literal
from sqlalchemy.sql import func
from typing import Optional
import os
import google.generativeai as genai
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
    vector_str: Optional[str] = Query(None, alias="vector"),
    db: Session = Depends(database.get_db)
):
    # Sanitize period (handle 'all' or invalid strings)
    if period and not period.isdigit():
        period = None
    
    results = []
    
    # helper to check if we should search a specific type
    def should_search_type(t):
        return type is None or type == t

    # 0. Global Query Expansion (FTS & Synonyms)
    q_expanded = q
    search_terms = [q]
    
    # Handle user-provided expanded keywords from frontend
    if expanded:
        extra_terms = [t.strip() for t in expanded.split(',') if t.strip()]
        search_terms.extend(extra_terms)
    
    # Synonyms Dictionary (Unified - Level 5 "Evergreen")
    POLITICAL_SYNONYMS = {
        # Economic / Everyday (Kasa & Rachunki)
        'drożyzna': ['inflacja', 'ceny', 'vat', 'koszyk', 'akcyza', 'tarcza'],
        'podatki': ['danin', 'pit', 'cit', 'akcyza', 'kwota wolna', 'ryczałt'],
        'małpki': ['wychowaniu w trzeźwości', 'napojów alkoholowych', 'opakowaniach', 'alkohol'],
        'piec': ['czyste powietrze', 'termomoderniz', 'źródła ciepła', 'węgiel', 'palenisk'],
        'praca': ['zatrudnienie', 'bezrobocie', 'płaca', 'minimalna', 'umowa', 'kodeks pracy', 'zus', 'zasiłek'],
        'zakaz gotówki': ['limit płatności', 'obrót bezgotówkowy', 'pieniądz cyfrowy', 'prawo przedsiębiorców'],
        'babciowe': ['aktywny rodzic', 'świadczenie rodzicielskie', 'aktywni w pracy', 'opiece nad dzieckiem'],
        'wakacje od zus': ['zwolnienie z opłacania', 'składek na ubezpieczenia', 'ubezpieczeń społecznych'],
        'bon energetyczny': ['dodatek osłonowy', 'ceny energii', 'rekompensata', 'taryfy', 'mrożenie cen'],
        'ceny paliw': ['opłata paliwowa', 'opłata emisyjna', 'benzyna', 'orlen', 'akcyza'],
        'test przedsiębiorcy': ['działalność gospodarcza', 'uszczelnienie', 'podatki', 'b2b', 'samozatrudnienie'],
        'lex uber': ['transport drogowy', 'przewóz osób', 'pośrednictwo', 'licencja', 'taksówki', 'aplikację'],

        # Social / Election Promises / Health
        'kwota wolna': ['podatku dochodowym', 'pit', 'zwiększenie kwoty', 'podatek'],
        'kredyt 0': ['pierwsze mieszkanie', 'mieszkanie na start', 'wspieraniu budownictwa', 'bezpieczny kredyt', 'dopłaty'],
        'dobrowolny zus': ['wakacje składkowe', 'system ubezpieczeń', 'zus', 'przedsiębiorc'],
        'renta wdowia': ['emeryturach i rentach', 'fundusz ubezpieczeń', 'wdowi', 'obywatelski projekt'],
        '800 plus': ['wychowywaniu dzieci', 'świadczenie wychowawcze', 'rodzina 800'],
        'porodówki': ['restrukturyzacja szpitali', 'sieć szpitali', 'oddziały położnicze', 'mapa potrzeb', 'likwidacja'],
        'składka zdrowotna': ['świadczenia opieki', 'finansowanie', 'ryczałt', 'liniowy', 'nfz'],
        'druga waloryzacja': ['emeryturach i rentach', 'fus', 'inflacja', 'waloryzacja', 'wypłata'],

        # Worldview / Bioethical / Lifestyle
        'aborcja': ['ciąż', 'płód', 'życie poczęte', 'terminacja', 'przerywanie'],
        'in vitro': ['leczenie niepłodności', 'zapłodnienie', 'procedury medycznej'],
        'tabletka dzień po': ['antykoncepcja', 'awaryjna', 'pigułka', 'prawo farmaceutyczne', 'recept', 'octan uliprystalu'],
        'fundusz kościelny': ['wyznaniowe', 'związki wyznaniowe', 'finansowanie kościoła'],
        'związki partnerskie': ['równość', 'osoby najbliższej', 'wspólne pożycie', 'małżeństw', 'tęczow'],
        'rejestr ciąż': ['system informacji medycznej', 'zdarzenia medyczne', 'minister zdrowia'],
        'robaki': ['nowa żywność', 'novel food', 'białko owadzie', 'mąka ze świerszczy'],
        'indoktrynacja': ['historia i teraźniejszość', 'czarnek', 'podstawa programowa', 'kurator oświaty'],
        'alkohol na stacjach': ['wychowanie w trzeźwości', 'godziny sprzedaży', 'sprzedaż nocna', 'stacja benzynowa'],
        'zakaz telefonów': ['prawo oświatowe', 'higiena cyfrowa', 'rzecznik praw dziecka', 'statut szkoły'],
        'prace domowe': ['ocenianie', 'klasyfikowanie', 'promowanie', 'zadawanie prac', 'brak zadań'],

        # Housing / Ecology / City
        'pustostan': ['nieruchomości', 'czynności cywilnoprawnych', 'lokal niezamieszkany', 'flipperzy', 'pcc'],
        'willa plus': ['dotacj', 'organizacjom', 'edukacyjn', 'inwestycje', 'czarnek'],
        'lex deweloper': ['ułatwieniach', 'inwestycji mieszkaniowych', 'planowania przestrzennego'],
        'patodeweloperka': ['warunki techniczne', 'prawo budowlane', 'nasłonecznienie', 'metraż', 'balkony'],
        'eksmisja': ['ochrona praw lokatorów', 'lokal socjalny', 'okres ochronny', 'na bruk'],
        'kaucja': ['gospodarka opakowaniami', 'system kaucyjny', 'recyklerzy', 'odpady', 'butelkomaty', 'zwrot butelek'],
        'deszczówka': ['prawo wodne', 'retencja', 'zabetonowane', 'podatek od deszczu'],
        'betonoza': ['powierzchnia biologicznie czynna', 'zagospodarowanie przestrzenne', 'tereny zielone', 'wycinka drzew'],

        # Afery / Media Slang / Justice
        'lex tvn': ['radiofoni', 'telewizji', 'krajowa rada', 'krrit', 'kapitał'],
        'piątka dla zwierząt': ['ochronie zwierząt', 'futerkow', 'ubój rytualny'],
        'weto': ['prezydent', 'odrzucenie', 'ponowne rozpatrzenie'],
        'koryto': ['wynagrodz', 'uposażeń', 'spółk', 'rad nadzorczych'],
        'afera wizowa': ['wizy', 'konsularne', 'pośrednictwo wizowe', 'komisja śledcza', 'badania legalności'],
        'wybory kopertowe': ['korespondencyjne', 'szczególnych zasadach', 'poczta polska'],
        'pegasus': ['kontrola operacyjna', 'inwigilacja', 'szpiegowskie', 'służb'],
        'wycinka puszczy': ['lasy państwowe', 'gospodarka leśna', 'plan urządzenia lasu', 'puszcza białowieska'],
        'neosędziowie': ['krajowa rada sądownictwa', 'powołania sędziowskie', 'status sędziego', 'krs', 'uchwała'],
        'sądy': ['wymiar sprawiedliwości', 'krs', 'sędzi', 'wyrok', 'trybunał'],

        # Security / Investments / Cars
        'zbrojenia': ['obrona', 'wojsko', 'armia', 'modernizacja', 'szpej'],
        'mur': ['bariera', 'zapora', 'ochrona granicy', 'drogowa', 'przymusowej', 'straż graniczna'],
        'zboże': ['ukrai', 'import', 'rolne', 'ekoport', 'embargo', 'produktów rolnych'],
        'imigranci': ['cudzoziem', 'granic', 'uchodź', 'zapora'],
        'cpk': ['centralny port komunikacyjny', 'baranów', 'lotnisko', 'pełnomocnik rządu'],
        'elektrownia atomowa': ['jądrowa', 'choczewo', 'kopalino', 'energetyka jądrowa'],
        'auta': ['konfiskat', 'kodeks karny', 'pojazd', 'nietrzeźw', 'pijanym', 'elektromobilność', 'strefa czystego transportu'],
        'konfiskata aut': ['przepadek pojazdu', 'kodeks karny', 'prowadzenie w stanie nietrzeźwości'],
        'zakaz diesla': ['elektromobilność', 'strefa czystego transportu', 'normy emisji', 'euro', 'sct'],
        'mandaty': ['prawo o ruchu drogowym', 'wysokość grzywien', 'taryfikator', 'prędkość'],
        'wezwania do wojska': ['kwalifikacja wojskowa', 'ćwiczenia rezerwy', 'obrona ojczyzny', 'wcr', 'pobór'],
        'schrony': ['ochrona ludności', 'obrona cywilna', 'budowle ochronne', 'syreny'],
        'dyrektywa inwigilacyjna': ['chat control', 'prywatność', 'komunikacja elektroniczna', 'szyfrowanie', 'inwigilacja'],
        'podatek od smartfona': ['opłata reprograficzna', 'prawo autorskie', 'rekompensata', 'artystów'],
        
        # People / Specifics
        'nawrocki': ['ipn', 'instytut pamięci', 'prezes', 'powołanie', 'karol nawrocki', 'uchwała w sprawie powołania', 'weto'],
        'prezes ipn': ['nawrocki', 'karol', 'instytut pamięci narodowej'],
        'ustawa łańcuchowa': ['ochrona zwierząt', 'na uwięzi', 'kojce', 'znęcanie się', 'dobrostan zwierząt', 'weto'],
        'pielęgniark': ['wynagrodz', 'lecznicz', 'medycz', 'system zdrowia'],
        'nauczyciel': ['karta nauczyciela', 'oświat', 'szkoł', 'czarnek'],
        'mentzen': ['podatki', 'pit', 'konfederacja', 'stereotyp'],
    }
    
    # Expand query
    q_lower = q.lower()
    for key, values in POLITICAL_SYNONYMS.items():
        if key in q_lower:
            search_terms.extend(values)
            
    if len(search_terms) > 1:
        # Use " OR " for websearch_to_tsquery which handles mixed AND/OR logic
        q_expanded = " OR ".join([f'"{t}"' for t in search_terms]) 
    
    # Client Vector Parsing (deprecated in favor of Gemini embedding)
    query_vec = None
    if vector_str and isinstance(vector_str, str):
        try:
            query_vec = [float(x) for x in vector_str.split(',')]
            if len(query_vec) != 384:
                query_vec = None
        except ValueError:
            pass

    # --- AI QUERY EXPANSION (The "Translator") ---
    def expand_query_with_llm(user_query):
        try:
            model = genai.GenerativeModel('models/gemini-flash-latest')
            prompt = f"""
            Jesteś ekspertem polskiego parlamentaryzmu. 
            Przetłumacz potoczne lub slangowe zapytanie użytkownika na oficjalne słowa kluczowe legislacji.
            
            Zapytanie: "{user_query}"
            
            Jeśli to potoczna nazwa afery lub ustawy (np. "Lex TVN", "Ustawa Łańcuchowa"), podaj oficjalne tematy.
            Jeśli to nazwisko, podaj funkcje (np. "Prezes IPN").
            
            Wypisz TYLKO słowa kluczowe oddzielone przecinkami. Maksymalnie 5 silnych fraz.
            Przykład: "Willa Plus" -> Dotacje edukacyjne, Czarnek, Inwestycje w oświacie
            """
            response = model.generate_content(prompt)
            if response.text:
                return [t.strip() for t in response.text.split(',') if t.strip()]
            return []
        except Exception as e:
            print(f"AI Expansion failed: {e}")
            return []

    # --- UNIFIED HYBRID SEARCH (AI + KEYWORD BOOST) ---
    semantic_results = []
    processed_types = set()
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        
        try:
            # 1. Check Query Cache
            cached = db.query(models.QueryEmbedding).filter(models.QueryEmbedding.query == q.lower()).first()
            
            expanded_terms = []
            
            if cached:
                # Use existing embedding
                if cached.embedding is not None:
                    query_embedding = list(cached.embedding) if hasattr(cached.embedding, 'tolist') else cached.embedding
                
                # Check for cached AI expansion
                if cached.ai_expansion:
                    expanded_terms = cached.ai_expansion
                else:
                    # Generate expansion if missing
                    expanded_terms = expand_query_with_llm(q)
                    cached.ai_expansion = expanded_terms
                    db.commit()
                
                cached.search_count += 1
                cached.last_searched_at = func.now()
                db.commit()
            else:
                # 2. Generate new embedding & expansion
                # Use gemini-embedding-001 with explicit dimensionality as in ETL script
                try:
                    result = genai.embed_content(
                        model="models/gemini-embedding-001",
                        content=q,
                        task_type="retrieval_query",
                        output_dimensionality=768
                    )
                except TypeError:
                    # Fallback if library version doesn't support arg for this model
                    result = genai.embed_content(
                        model="models/gemini-embedding-001",
                        content=q,
                        task_type="retrieval_query"
                    )
                    
                query_embedding = result['embedding']
                
                # Generate expansion
                expanded_terms = expand_query_with_llm(q)
                
                # Save to cache
                new_cache = models.QueryEmbedding(
                    query=q.lower(),
                    embedding=query_embedding,
                    search_count=1,
                    last_searched_at=func.now(),
                    ai_expansion=expanded_terms
                )
                db.add(new_cache)
                db.commit()

            # Ensure embedding is a list of native floats
            if hasattr(query_embedding, 'tolist'):
                query_embedding = query_embedding.tolist()
            elif isinstance(query_embedding, list) and len(query_embedding) > 0 and hasattr(query_embedding[0], 'item'):
                 query_embedding = [float(x) for x in query_embedding]

            embedding_str = str(query_embedding)
            
            # --- MERGE AI TERMS INTO SEARCH ---
            if expanded_terms:
                search_terms.extend(expanded_terms)
            
            # Prepare patterns for Hybrid Search
            unique_terms = list(set([q] + [t for t in search_terms if t and len(t) > 2]))[:5]
            # Use regex for word boundaries to avoid false positives (e.g. "rata" -> "Ratajski")
            regex_patterns = []
            for t in unique_terms:
                if len(t) <= 4:
                    regex_patterns.append(rf'\m{t}') # Match at least start of word
                else:
                    regex_patterns.append(t)
            regex_combined = '|'.join(regex_patterns)

            # 3. Hybrid Search in Votes
            if should_search_type('vote'):
                processed_types.add('vote')
                vote_sql = text("""
                    SELECT 
                        id,
                        title_clean,
                        topic,
                        date,
                        term,
                        kind,
                        CASE 
                            WHEN unaccent(title_clean) ~* unaccent(:regex) THEN 1.0 
                            WHEN vector_embedding IS NULL THEN 0.0
                            ELSE 1 - (vector_embedding <=> CAST(:embedding AS vector)) 
                        END as similarity
                    FROM votes
                    WHERE (vector_embedding IS NOT NULL OR unaccent(title_clean) ~* unaccent(:regex))
                    AND (:term IS NULL OR term = :term)
                    ORDER BY similarity DESC
                    LIMIT 20
                """)
                
                votes = db.execute(vote_sql, {
                    "embedding": embedding_str, 
                    "regex": regex_combined,
                    "term": int(period) if period else None
                }).fetchall()
                
                for v in votes:
                    if v.similarity > 0.4: # Hybrid threshold
                        semantic_results.append({
                            "type": "vote",
                            "id": str(v.id),
                            "title": v.title_clean,
                            "date": str(v.date),
                            "term": v.term,
                            "topic": v.topic,
                            "ux_category": v.kind or "Głosowanie",
                            "is_semantic": True,
                            "relevance_score": float(v.similarity)
                        })

            # 4. Hybrid Search in Bills
            if should_search_type('process'):
                processed_types.add('process')
                bill_sql = text("""
                    SELECT 
                        id,
                        process_id,
                        number,
                        title,
                        topic,
                        date,
                        type,
                        CASE 
                            WHEN unaccent(title) ~* unaccent(:regex) THEN 1.0 
                            WHEN vector_embedding IS NULL THEN 0.0
                            ELSE 1 - (vector_embedding <=> CAST(:embedding AS vector)) 
                        END as similarity
                    FROM bills
                    WHERE (vector_embedding IS NOT NULL OR unaccent(title) ~* unaccent(:regex))
                    ORDER BY similarity DESC
                    LIMIT 20
                """)
                
                bills = db.execute(bill_sql, {
                    "embedding": embedding_str, 
                    "regex": regex_combined
                }).fetchall()
                
                for b in bills:
                    if b.similarity > 0.4:
                        # Term logic
                        b_term = 10 if not b.date or str(b.date) >= '2023-11-13' else 9
                        if period and int(period) != b_term:
                            continue

                        semantic_results.append({
                            "type": "process",
                            "id": b.process_id or str(b.id),
                            "title": f"Druk nr {b.number}: {b.title}",
                            "date": str(b.date),
                            "term": b_term,
                            "topic": b.topic,
                            "ux_category": b.type or "Projekt",
                            "is_semantic": True,
                            "relevance_score": float(b.similarity)
                        })

            # 5. Hybrid Search in Interpellations
            if should_search_type('interpellation'):
                processed_types.add('interpellation')
                interp_sql = text("""
                    SELECT 
                        id,
                        title,
                        sent_date,
                        CASE 
                            WHEN unaccent(title) ~* unaccent(:regex) THEN 1.0 
                            WHEN vector_embedding IS NULL THEN 0.0
                            ELSE 1 - (vector_embedding <=> CAST(:embedding AS vector)) 
                        END as similarity
                    FROM interpellations
                    WHERE (vector_embedding IS NOT NULL OR unaccent(title) ~* unaccent(:regex))
                    ORDER BY similarity DESC
                    LIMIT 15
                """)
                
                interps = db.execute(interp_sql, {
                    "embedding": embedding_str, 
                    "regex": regex_combined
                }).fetchall()
                
                for i in interps:
                    if i.similarity > 0.4:
                        semantic_results.append({
                            "type": "interpellation",
                            "id": str(i.id),
                            "title": i.title,
                            "date": str(i.sent_date),
                            "topic": "Interpelacja",
                            "ux_category": "Interpelacja",
                            "is_semantic": True,
                            "relevance_score": float(i.similarity)
                        })
                        
        except Exception as e:
            print(f"Hybrid search failed: {e}")
    
    # --- TRADITIONAL FALLBACK SEARCH (Only if Hybrid didn't run for that type) ---
    results = []
    
    # 1. Search across MPs (Traditional)
    if should_search_type('mp') and not period:
        # ... logic for MPs remains largely the same ...
        full_name_normal = func.concat(models.MP.first_name, ' ', models.MP.last_name)
        full_name_reverse = func.concat(models.MP.last_name, ' ', models.MP.first_name)
        mp_query = db.query(models.MP)
        q_unaccent = func.unaccent(q)
        mps_candidates = mp_query.filter(or_(
            func.unaccent(models.MP.first_name).ilike(func.concat('%', q_unaccent, '%')),
            func.unaccent(models.MP.last_name).ilike(func.concat('%', q_unaccent, '%')),
            func.unaccent(full_name_normal).ilike(func.concat('%', q_unaccent, '%')),
            func.unaccent(full_name_reverse).ilike(func.concat('%', q_unaccent, '%'))
        )).limit(5).all() # Reduced limit to 5 as per snippet
        
        # Deduplicate by name (taking the most recent term) - Re-added original deduplication logic
        unique_mps = {}
        for mp in mps_candidates:
            key = (mp.first_name, mp.last_name)
            if key not in unique_mps:
                unique_mps[key] = mp
            else:
                # If we have a duplicate, keep the one from the higher term
                if mp.term > unique_mps[key].term:
                    unique_mps[key] = mp
        
        # Sort by relevance (active first, then term desc) and limit
        # Python sort is stable.
        sorted_mps = sorted(unique_mps.values(), key=lambda x: (x.term, x.active), reverse=True)
        
        for mp in sorted_mps[:6]: # Keep original limit for MPs
            mp_dict = {c.name: getattr(mp, c.name) for c in mp.__table__.columns}
            results.append({
                "type": "mp",
                "id": str(mp.id),
                "title": f"{mp.first_name} {mp.last_name}",
                "data": mp_dict
            })

    # 2. Add traditional Vote results (FTS) - Only if Hybrid didn't run
    if should_search_type('vote') and 'vote' not in processed_types:
        vote_query = db.query(models.Vote)
        if period: vote_query = vote_query.filter(models.Vote.term == int(period))
        try:
            # Use websearch_to_tsquery for "OR" support
            trad_votes = vote_query.filter(models.Vote.search_vector.op('@@')(func.websearch_to_tsquery('simple', q_expanded))).limit(10).all()
        except:
            q_unaccent = func.unaccent(q)
            trad_votes = vote_query.filter(func.unaccent(models.Vote.title_raw).ilike(func.concat('%', q_unaccent, '%'))).limit(10).all()
            
        for vote in trad_votes:
            results.append({
                "type": "vote", "id": str(vote.id), "title": vote.title_clean, "date": str(vote.date),
                "term": vote.term, "topic": vote.topic, "ux_category": vote.kind or "Głosowanie",
                "sitting": vote.sitting, # Re-added original fields
                "voting_number": vote.voting_number # Re-added original fields
            })

    # 3. Traditional Bills - Only if Hybrid didn't run
    if should_search_type('process') and 'process' not in processed_types:
        bill_query = db.query(models.Bill)
        if period:
            p = int(period)
            if p == 10:
                bill_query = bill_query.filter(models.Bill.date >= '2023-11-13')
            elif p == 9:
                bill_query = bill_query.filter(models.Bill.date < '2023-11-13', models.Bill.date >= '2019-11-12')
        
        # NO, I will use OR ILIKE chain for synonyms.
        q_unaccent = func.unaccent(q)
        conditions = [
            func.unaccent(models.Bill.title).ilike(func.concat('%', func.unaccent(t), '%')) for t in search_terms[:5] # Limit terms to avoid huge query
        ]
        trad_bills = bill_query.filter(or_(*conditions)).limit(10).all() # Reduced limit to 10 as per snippet
        
        for bill in trad_bills:
            b_term = 10 if not bill.date or str(bill.date) >= '2023-11-13' else 9
            results.append({
                "type": "process", "id": bill.process_id or str(bill.id), "title": f"Druk nr {bill.number}: {bill.title}",
                "date": str(bill.date), "term": b_term, "topic": bill.topic, "ux_category": bill.type or "Projekt"
            })

    # Combined results merging logic
    final_results = []
    
    # 1. Collect all candidates
    all_candidates = []
    for r in results:
        r['relevance_boost'] = 0.5 # Default for traditional matches
        all_candidates.append(r)
        
    for r in semantic_results:
        # Trust the hybrid score directly
        r['relevance_boost'] = r.get('relevance_score', 0.5)
        all_candidates.append(r)

    # 2. Sort and deduplicate
    all_candidates.sort(key=lambda x: x.get('relevance_boost', 0), reverse=True)
    
    seen_ids = set()
    for r in all_candidates:
        unique_key = f"{r['type']}_{r['id']}"
        if unique_key not in seen_ids:
            seen_ids.add(unique_key)
            final_results.append(r)

    # 4. Speeches (keep small for now)
    if should_search_type('speech'):
        speech_query = db.query(models.Speech)
        if period:
            speech_query = speech_query.filter(models.Speech.term == int(period))
            
        speeches = speech_query.filter(
            func.unaccent(models.Speech.content).ilike(func.concat('%', func.unaccent(q), '%'))
        ).limit(5).all()
        
        for s in speeches:
            # Ensure speeches are also deduplicated if they somehow overlap (unlikely for speeches)
            unique_key = f"speech_{s.id}"
            if unique_key not in seen_ids:
                seen_ids.add(unique_key)
                content_preview = (s.content[:200] + "...") if s.content else "Brak treści..."
                final_results.append({
                    "type": "speech", "id": str(s.id), "title": f"Wypowiedź: {s.speaker_name}",
                    "date": str(s.date), "content_preview": content_preview, "term": s.term, "mp_id": str(s.mp_id)
                })

    # 5. Traditional Interpellations - Only if Hybrid didn't run
    if should_search_type('interpellation') and 'interpellation' not in processed_types:
        inter_query = db.query(models.Interpellation)
        q_unaccent = func.unaccent(q)
        trad_inters = inter_query.filter(func.unaccent(models.Interpellation.title).ilike(func.concat('%', q_unaccent, '%'))).limit(10).all()
        for i in trad_inters:
            unique_key = f"interpellation_{i.id}"
            if unique_key not in seen_ids:
                seen_ids.add(unique_key)
                final_results.append({
                    "type": "interpellation",
                    "id": str(i.id),
                    "title": i.title,
                    "date": str(i.sent_date),
                    "topic": "Interpelacja",
                    "ux_category": "Interpelacja"
                })

    return final_results


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
    
    # Eager load authors to avoid N+1 and fix potential serialization issues
    interpellations = query.options(joinedload(models.Interpellation.authors))\
        .order_by(models.Interpellation.sent_date.desc()).offset(skip).limit(limit).all()
    
    final_items = []
    for i in interpellations:
        # Robust serialization: exclude Vector types which crash JSON encoder
        i_dict = {c.name: getattr(i, c.name) for c in i.__table__.columns if c.name != 'vector_embedding'}
        # Serialize authors manually to be safe
        i_dict['authors'] = [
            {c.name: getattr(a, c.name) for c in a.__table__.columns} 
            for a in i.authors
        ]
        final_items.append(i_dict)
        
    return final_items

@router.get("/interpellations/{id}")
def read_interpellation(id: int, db: Session = Depends(database.get_db)):
    interpellation = db.query(models.Interpellation).options(joinedload(models.Interpellation.authors)).filter(models.Interpellation.id == id).first()
    if not interpellation:
        raise HTTPException(status_code=404, detail="Interpellation not found")
    
    # Safe serialization
    i_dict = {c.name: getattr(interpellation, c.name) for c in interpellation.__table__.columns if c.name != 'vector_embedding'}
    
    # Serialize authors
    i_dict['authors'] = [
        {c.name: getattr(a, c.name) for c in a.__table__.columns} 
        for a in interpellation.authors
    ]
    
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
@router.get("/sejm/upcoming-sittings")
def get_upcoming_sittings():
    """Fetch future sittings directly from Sejm API."""
    import requests
    from datetime import date
    try:
        r = requests.get("https://api.sejm.gov.pl/sejm/term10/proceedings", timeout=5)
        if r.status_code != 200:
            return []
        
        data = r.json()
        today = date.today().isoformat()
        
        upcoming = []
        for sitting in data:
            # Check if any date in the sitting is today or in the future
            dates = sitting.get('dates', [])
            if any(d >= today for d in dates):
                upcoming.append({
                    "number": sitting.get('number'),
                    "title": sitting.get('title'),
                    "dates": dates,
                    "is_current": sitting.get('current', False)
                })
        
        return upcoming
    except Exception as e:
        print(f"Error fetching upcoming sittings: {e}")
        return []
