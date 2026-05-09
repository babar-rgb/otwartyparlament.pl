import sys, os; sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import sys, os; sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import psycopg2.extras
import os
import json
import google.generativeai as genai
from backend.news_sync import TOPICS # For future use if needed
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Konfiguracja Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

DB_CONFIG = {
    "host":     os.getenv("POSTGRES_HOST", "127.0.0.1"),
    "port":     int(os.getenv("POSTGRES_PORT", 5432)),
    "dbname":   os.getenv("POSTGRES_DB", "otwarty_parlament"),
    "user":     os.getenv("POSTGRES_USER", "kajtek"),
    "password": os.getenv("POSTGRES_PASSWORD", ""),
}

class ArticleRequest(BaseModel):
    topic: str
    keywords: Optional[List[str]] = []

@router.post("/generate-article-brief")
async def generate_article_brief(req: ArticleRequest):
    """
    Generuje szkielet artykułu na podstawie danych z Sejmu.
    """
    # 1. Przygotuj słowa kluczowe do wyszukiwania w SQL
    search_terms = [req.topic] + (req.keywords or [])
    # Usuwamy puste i duplikaty
    search_terms = list(set([t.lower() for t in search_terms if t]))
    
    if not search_terms:
        raise HTTPException(status_code=400, detail="Musisz podać temat lub słowa kluczowe.")

    # 2. Pobierz dane z bazy (Głosowania i Procesy)
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Budujemy warunek ILIKE dla wielu słów
    like_clauses = " OR ".join(["unaccent(title_clean) ILIKE unaccent(%s)" for _ in search_terms])
    like_params = [f"%{t}%" for t in search_terms]

    try:
        # Pobierz 5 najnowszych pasujących głosowań
        cur.execute(f"""
            SELECT id, title_clean, date, verdict, details_json
            FROM votes
            WHERE {like_clauses}
            ORDER BY date DESC
            LIMIT 5
        """, like_params)
        votes = [dict(r) for r in cur.fetchall()]

        # Pobierz pasujące procesy legislacyjne
        cur.execute(f"""
            SELECT id, title, status, start_date
            FROM legislative_processes
            WHERE {like_clauses.replace('title_clean', 'title')}
            ORDER BY start_date DESC
            LIMIT 3
        """, like_params)
        processes = [dict(r) for r in cur.fetchall()]

        cur.close()
        conn.close()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Błąd bazy danych: {str(e)}")

    if not votes and not processes:
        return {"error": "Nie znaleziono żadnych danych w Sejmie dla podanych słów kluczowych."}

    # 3. Przygotuj dane dla Gemini
    context_data = {
        "temat_dnia": req.topic,
        "glosowania": [],
        "procesy_legislacyjne": []
    }

    for v in votes:
        # Serializacja daty do stringa
        v_date = v['date'].strftime('%Y-%m-%d') if hasattr(v['date'], 'strftime') else str(v['date'])
        stats = v['details_json'] or {}
        context_data["glosowania"].append({
            "tytul": v['title_clean'],
            "data": v_date,
            "wynik": v['verdict'],
            "statystyki": {
                "za": stats.get('yes', 0),
                "przeciw": stats.get('no', 0),
                "wstrzymalo_sie": stats.get('abstain', 0)
            }
        })

    for p in processes:
        p_date = p['start_date'].strftime('%Y-%m-%d') if hasattr(p['start_date'], 'strftime') else str(p['start_date'])
        context_data["procesy_legislacyjne"].append({
            "tytul": p['title'],
            "status": p['status'],
            "data_rozpoczecia": p_date
        })

    # 4. Generowanie odpowiedzi (AI lub MOCK)
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key or api_key == "":
        # TRYB MOCK - Symulacja odpowiedzi AI na podstawie rzeczywistych danych z bazy
        sample_vote = votes[0] if votes else {"title_clean": "Brak danych", "verdict": "---"}
        sample_proc = processes[0] if processes else {"title": "Brak danych", "status": "---"}
        
        return {
            "title": f"Dlaczego Sejm zajmuje się tematem {req.topic.lower()} właśnie teraz?",
            "lead": f"W ciągu ostatnich 24 godzin temat {req.topic} zdominował media, pojawiając się w licznych portalach. Sejm RP podjął konkretne kroki legislacyjne w tym obszarze.",
            "key_data": [
                f"Głosowanie nad projektem: '{sample_vote['title_clean']}' zakończyło się wynikiem: {sample_vote['verdict']}.",
                f"W procesie legislacyjnym znajduje się ustawa: '{sample_proc['title']}', aktualny status: {sample_proc['status']}."
            ],
            "club_breakdown": "Szczegółowy rozkład głosów ZA/PRZECIW dla poszczególnych klubów zostanie wygenerowany po podłączeniu AI.",
            "sources": [v['title_clean'] for v in votes] + [p['title'] for p in processes],
            "note": "To jest MOCKOWY JSON. Podłącz GEMINI_API_KEY w .env, aby aktywować prawdziwe AI."
        }

    # Jeśli klucz istnieje - idź do Gemini (Logika poniżej pozostaje bez zmian)
    try:
        response = model.generate_content(prompt)
        # ... (reszta logiki generowania)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
             text = text.split("```")[1].split("```")[0].strip()
        
        brief = json.loads(text)
        return brief
    except Exception as e:
        return {"error": "Błąd AI lub brak klucza", "details": str(e)}

