import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from openai import OpenAI

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteCategory, VoteAnalysis

# Load env
ENV_PATH = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(ENV_PATH)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("WARNING: OPENAI_API_KEY not found in .env. Script will fail if run.")

client = OpenAI(api_key=api_key)

def analyze_vote(vote: Vote, db: Session):
    print(f"Analyzing vote {vote.id}: {vote.title_clean or vote.title_raw}")
    
    prompt = f"""
    Jesteś analitykiem politycznym. Przeanalizuj poniższe głosowanie z polskiego Sejmu.
    Tytuł: {vote.title_clean or vote.title_raw}
    Opis: {vote.description or "Brak opisu"}
    
    Zwróć wynik w czystym formacie JSON:
    {{
        "summary": "Krótkie wyjaśnienie w 1-2 zdaniach o co chodzi w ustawie (język prosty, dla laika).",
        "impact": "Kogo to dotyczy? (np. przedsiębiorcy, emeryci, kierowcy).",
        "controversy": "Jakie są główne kontrowersje lub powód sporu? (jeśli brak, wpisz 'Brak większych kontrowersji').",
        "category_name": "Kategoria główna (np. Gospodarka, Prawo, Zdrowie, Obronność, Edukacja, Światopogląd, Inne).",
        "importance": (liczba całkowita 1-10, gdzie 10 to ustawa zmieniająca ustrój lub kluczowa dla budżetu, a 1 to zmiana nazwy ulicy)
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        # 1. Get/Create Category
        category_name = data.get("category_name", "Inne")
        category = db.query(VoteCategory).filter(VoteCategory.name == category_name).first()
        if not category:
            category = VoteCategory(name=category_name)
            db.add(category)
            db.flush() # get ID
            
        # 2. Create Analysis
        analysis = VoteAnalysis(
            vote_id=vote.id,
            summary=data.get("summary"),
            impact=data.get("impact"),
            controversy=data.get("controversy"),
            category_id=category.id,
            key_vote=(data.get("importance", 0) >= 7)
        )
        db.add(analysis)
        
        # 3. Update Vote
        vote.importance = data.get("importance", 0)
        vote.topic = category_name # redundancja dla kompatybilności
        
        db.commit()
        print(f" -> Done. Category: {category_name}, Importance: {vote.importance}")
        
    except Exception as e:
        print(f" -> Error analyzing vote {vote.id}: {e}")
        db.rollback()

def main():
    db = SessionLocal()
    try:
        # Fetch votes without analysis
        # Using a join or subquery would be better, but loop is simple for script
        votes = db.query(Vote).filter(~Vote.analysis.has()).limit(10).all() # Limit 10 to save tokens for testing
        
        print(f"Found {len(votes)} votes to analyze.")
        for vote in votes:
            analyze_vote(vote, db)
            
    finally:
        db.close()

if __name__ == "__main__":
    main()
