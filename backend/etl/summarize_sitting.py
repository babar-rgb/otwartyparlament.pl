
import os
import sys
import logging
import argparse
from datetime import datetime

# Ensure backend path is in sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.db import db
from backend.services.gemini import gemini_service

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SittingSummarizer:
    def __init__(self):
        self.db = db
        self.gemini = gemini_service

    def get_sitting_votes(self, term, sitting):
        """Fetch important votes for a sitting, prioritizing high importance and bills."""
        query = """
            SELECT 
                id,
                COALESCE(street_title, title_clean, title_raw) as title, 
                topic as topic_tag, 
                ai_summary, 
                verdict,
                importance as importance_score,
                CASE WHEN COALESCE(title_clean, title_raw) ILIKE '%%ustawa%%' THEN 5 ELSE 0 END + COALESCE(importance, 0) as weight
            FROM votes 
            WHERE term = %s AND sitting = %s AND is_procedural = False
            ORDER BY weight DESC, created_at DESC
            LIMIT 20
        """
        return self.db.fetch_all(query, (term, sitting))

    def generate_summary(self, term, sitting):
        """Generate a bullet-point summary for a sitting."""
        votes = self.get_sitting_votes(term, sitting)
        
        if not votes:
            logger.warning(f"No votes found for Term {term}, Sitting {sitting}")
            return None

        # Check for Gemini Key (Placeholder for future switch)
        if not os.environ.get("GEMINI_API_KEY"):
            logger.warning(" ⚠️  SKIPPING AI SUMMARY: 'GEMINI_API_KEY' not found in environment.")
            logger.warning("    Please add GEMINI_API_KEY to .env to enable automatic sitting summaries.")
            return None

        # Construct Prompt with pre-cleaned titles
        import re
        context_str = ""
        for v in votes:
            # Clean title from common prefixes like "13. ", "Druk nr..."
            clean_title = re.sub(r'^\d+[\.\s]+', '', v['title']) # Remove leading numbers
            clean_title = re.sub(r'\(druki? nr.*?\)', '', clean_title) # Remove (druki nr...)
            clean_title = clean_title.strip()
            
            context_str += f"- Tytuł: {clean_title}\n  Temat: {v['topic_tag']}\n  Wynik: {v['verdict']}\n"
            if v['ai_summary']:
                context_str += f"  Info: {v['ai_summary'][:300]}\n"
            context_str += "\n"

        prompt = f"""
        Jesteś czołowym felietonistą politycznym i ekspertem ds. państwa. Twoim zadaniem jest stworzenie eleganckiego, "premium" podsumowania najważniejszych wydarzeń z najnowszego posiedzenia Sejmu.
        
        DANE WEJŚCIOWE (Głosowania i Ustawy):
        {context_str}
        
        KRYTYCZNE INSTRUKCJE STYLISTYCZNE:
        1. **ŻADNYCH NUMERÓW NA POCZĄTKU**: Nie zaczynaj punktów od "13 poselski...", "8 rządowy...". To brzmi biurokratycznie.
        2. **JĘZYK KORZYŚCI I ZNACZENIA**: Pisz o tym, CO TA DECYZJA OZNACZA dla obywatela, a nie tylko jak się nazywa.
        3. **FORMATOWANIE**: Każdy punkt: **POGRUBIONY TYTUŁ REDAKCYJNY** – krótki, esencjonalny opis (max 2-3 zdania).
        4. **BEZ ŻARGONU**: Usuń wzmianki o "drukach nr 2189", "poprawkach nr 1" itp. To ma być tekst do czytania przy kawie.
        5. **WYNIK**: Skup się na tym, czy ustawa przeszła dalej, czy została odrzucona.
        
        PRZYKŁAD IDEALNEGO STYLU:
        * **Reforma finansowania samorządów** – Sejm zdecydował o nowym sposobie podziału podatków, co znacząco zasili budżety mniejszych gmin i miast.
        * **Wzmocnienie statusu języków regionalnych** – Posłowie przegłosowali historyczne zmiany, które ułatwią naukę i pielęgnowanie śląskiej tożsamości.
        * **Nowe zasady prawa do azylu** – W trosce o bezpieczeństwo granicy przyjęto czasowe przepisy pozwalające na zawieszenie procedur azylowych w sytuacjach kryzysowych.
        
        WYNIK (Tylko 3-5 punktów w Markdown, bez Twoich komentarzy):
        """

        summary_data = self.gemini.generate_summary(context_str, title=f"Posiedzenie {sitting}")
        return summary_data.get('expert')

    def save_summary(self, term, sitting, summary, top_votes=None):
        """Save the generated summary and top votes to the database."""
        import json
        query = """
            INSERT INTO sitting_summaries (term, sitting_number, summary_md, top_votes, updated_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (term, sitting_number) 
            DO UPDATE SET 
                summary_md = EXCLUDED.summary_md, 
                top_votes = EXCLUDED.top_votes,
                updated_at = NOW();
        """
        top_votes_json = json.dumps(top_votes) if top_votes else None
        self.db.execute(query, (term, sitting, summary, top_votes_json))
        logger.info(f"Saved summary for Term {term}, Sitting {sitting}")



    def run(self):
        """Standard entry point for ETL pipeline."""
        self.run_for_latest()

    def run_for_latest(self):
        """Run summary generation for the latest sitting found in votes."""
        latest_query = "SELECT term, sitting FROM votes ORDER BY date DESC LIMIT 1"
        latest = self.db.fetch_one(latest_query)
        
        if latest:
            term = latest['term']
            sitting = latest['sitting']
            logger.info(f"Generating summary for latest sitting: Term {term}, Sitting {sitting}")
            summary = self.generate_summary(term, sitting)
            if summary:
                # Store top 3 most important votes specifically
                top_3 = []
                for v in votes[:3]:
                    top_3.append({
                        "id": v['id'],
                        "title": v['title'],
                        "verdict": v['verdict'],
                        "importance": v['importance_score']
                    })
                
                self.save_summary(term, sitting, summary, top_votes=top_3)
                print(f"Summary generated for Sitting {sitting}")
                print(summary)
        else:
            logger.warning("No votes found in DB to determine latest sitting.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--term", type=int, help="Sejm term")
    parser.add_argument("--sitting", type=int, help="Sitting number")
    args = parser.parse_args()

    summarizer = SittingSummarizer()
    
    if args.term and args.sitting:
        s = summarizer.generate_summary(args.term, args.sitting)
        if s:
            summarizer.save_summary(args.term, args.sitting, s)
            print(s)
    else:
        summarizer.run_for_latest()
