
import re
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from backend.core.orm_db import SessionLocal
from backend.core.config import config

class SearchService:
    def __init__(self):
        self.api_key = config.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
        
        self.intent_keywords = {
            "jak głosował": "votes",
            "głosowania":   "votes",
            "interpelacje": "interpellations",
            "interpelacja": "interpellations",
            "mowy":         "speeches",
            "wypowiedzi":   "speeches",
            "oświadczenia": "assets",
            "majątek":      "assets"
        }
        
        self.categories = [
            "GOSPODARKA", "ZDROWIE", "EDUKACJA", "PRAWO_KARNE", "BEZPIECZENSTWO",
            "POLITYKA_SPOLECZNA", "SRODOWISKO", "INFRASTRUKTURA", 
            "WYMIAR_SPRAWIEDLIWOSCI", "ROLNICTWO", "KULTURA", "SPRAWY_ZAGRANICZNE",
            "FINANSE_PUBLICZNE", "ADMINISTRACJA", "PRAWA_OBYWATELSKIE", "PROCEDURALNE"
        ]

    def classify_query(self, query: str) -> Dict[str, Any]:
        q = query.strip().lower()
        result = {
            "original": query, "normalized": q,
            "type": "TOPIC", "strategy": ["COLLOQUIAL", "FTS", "SEMANTIC", "ENTITY"],
            "colloquial_match": None, "entity_hint": None
        }
        
        # Język formalny
        druk_match = re.search(r'druk\s*(?:nr\s*)?(\d+)', q)
        if druk_match:
            result.update({"type": "FORMAL_PRINT", "entity_hint": {"type": "bill", "number": druk_match.group(1)}, "strategy": ["ENTITY"]})
            return result
        
        # Nazwisko + intencja
        for keyword, intent in self.intent_keywords.items():
            if keyword in q:
                name = q.replace(keyword, '').strip()
                if name:
                    result.update({"type": "PERSON_INTENT", "entity_hint": {"name": name, "intent": intent}, "strategy": ["ENTITY"]})
                    return result

        return result

    async def get_embedding(self, db, query: str) -> Optional[List[float]]:
        """Pobiera embedding z cache lub generuje nowy przez API Gemini."""
        if not self.api_key: return None
        
        # 1. Check Cache
        cached = db.execute(
            text("SELECT embedding FROM query_embeddings WHERE query = :q"),
            {"q": query.lower()}
        ).fetchone()
        
        if cached and cached[0]:
            raw = cached[0]
            if isinstance(raw, str):
                try:
                    # pgvector returns as "[0.1, 0.2, ...]"
                    vals = raw.strip('[]').split(',')
                    return [float(x) for x in vals if x.strip()]
                except:
                    pass
            return list(raw)
        
        # 2. Generate New
        try:
            res = genai.embed_content(
                model="models/text-embedding-004", # Newest Gemini embedding model
                content=query,
                task_type="retrieval_query"
            )
            embedding = res['embedding']
            
            # Save to cache
            db.execute(text("""
                INSERT INTO query_embeddings (query, embedding, search_count, last_searched_at)
                VALUES (:q, CAST(:v AS vector), 1, NOW())
                ON CONFLICT (query) DO UPDATE SET search_count = query_embeddings.search_count + 1
            """), {"q": query.lower(), "v": str(embedding)})
            db.commit()
            return embedding
        except Exception as e:
            print(f"Embedding error: {e}")
            return None

    async def search(self, query: str, limit: int = 10) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            classification = self.classify_query(query)
            results = {"votes": [], "interpellations": [], "mps": [], "meta_topics": [], "classification": classification}

            # 1. Colloquial & Meta Topics
            if "COLLOQUIAL" in classification["strategy"]:
                col = db.execute(text("SELECT * FROM colloquial_names WHERE phrase = :q"), {"q": classification["normalized"]}).fetchone()
                if col:
                    results["colloquial_match"] = dict(col._mapping)
                    if col.target_type == 'meta_topic':
                        mt = db.execute(text("SELECT * FROM meta_topics WHERE slug = :s"), {"s": col.target_id}).fetchone()
                        if mt: results["meta_topics"].append(dict(mt._mapping))

            # 2. Entity Match
            if "ENTITY" in classification["strategy"]:
                mps = db.execute(text("SELECT id, first_name, last_name, club, photo_url, slug FROM mps WHERE (first_name || ' ' || last_name) ILIKE :q OR slug ILIKE :q LIMIT 5"), {"q": f"%{query}%"}).fetchall()
                results["mps"] = [dict(r._mapping) for r in mps]

            # 3. Hybrid Search: FTS + Semantic
            embedding = await self.get_embedding(db, query)
            
            # --- VOTES ---
            votes_sql = """
                SELECT * FROM (
                    SELECT id, street_title, title_raw as title, verdict, date, topic, importance,
                           ts_rank(search_vector, plainto_tsquery('polish', :q)) as fts_score,
                           CASE WHEN vector_embedding IS NOT NULL AND :vec IS NOT NULL 
                                THEN 1 - (vector_embedding <=> CAST(:vec AS vector)) 
                                ELSE 0 END as sem_score
                    FROM votes
                ) sub
                WHERE fts_score > 0 OR sem_score > 0.1
                ORDER BY (COALESCE(fts_score, 0) * 0.6 + COALESCE(sem_score, 0) * 0.4) DESC 
                LIMIT :limit
            """
            params = {"q": query, "limit": limit, "vec": str(embedding) if embedding else None}
            
            v_recs = db.execute(text(votes_sql), params).fetchall()
            results["votes"] = [dict(r._mapping) for r in v_recs]

            # --- INTERPELLATIONS ---
            interp_fts = db.execute(text("""
                SELECT id, street_title, title, ai_summary as summary, sent_date as date,
                       ts_rank(search_vector, plainto_tsquery('polish', :q)) as rank
                FROM interpellations WHERE search_vector @@ plainto_tsquery('polish', :q)
                ORDER BY rank DESC LIMIT :limit
            """), {"q": query, "limit": limit}).fetchall()
            results["interpellations"] = [dict(r._mapping) for r in interp_fts]

            return results
        finally:
            db.close()

search_service = SearchService()
