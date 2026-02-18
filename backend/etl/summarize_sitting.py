
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
        """Fetch important votes for a sitting."""
        query = """
            SELECT 
                COALESCE(title_clean, title_raw) as title, 
                topic_tag, 
                description as ai_summary, 
                verdict,
                CASE WHEN COALESCE(title_clean, title_raw) ILIKE '%%ustawa%%' THEN 2 ELSE 1 END as weight
            FROM votes 
            WHERE term = %s AND sitting = %s
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

        # Sort votes to prioritize distinct topics
        # Simple heuristic: group by topic_tag or distinct titles
        
        # Construct Prompt
        context_str = ""
        for v in votes:
            context_str += f"- Tytuł: {v['title']}\n  Temat: {v['topic_tag']}\n  Wynik: {v['verdict']}\n"
            if v['ai_summary']:
                context_str += f"  Info: {v['ai_summary'][:200]}...\n"
            context_str += "\n"

        prompt = f"""
        Jesteś ekspertem legislacyjnym i dziennikarzem politycznym. Twoim zadaniem jest stworzenie krótkiego, profesjonalnego podsumowania (4-5 punktów) najważniejszych decyzji podjętych przez Sejm na danym posiedzeniu.
        
        Oto lista głosowań i ustaw z tego posiedzenia:
        
        {context_str}
        
        INSTRUKCJE:
        1. Wybierz 3-5 najważniejszych tematów (np. ustawa budżetowa, ważne zmiany w prawie karnym, głośne sprawy społeczne).
        2. Sformatuj wynik jako listę punktowaną Markdown.
        3. Styl ma być "premium", konkretny i informacyjny (patrz przykład).
        4. Każdy punkt musi mieć pogrubiony nagłówek i krótki opis po myślniku.
        5. NIE używaj wstępu ani zakończenia ("Oto podsumowanie..."). Tylko lista.
        
        PRZYKŁAD STYLU (TAK MA WYGLĄDAĆ WYNIK):
        * **Ustawa budżetowa na 2026 rok** – Sejm ostatecznie przyjął budżet z wydatkami na poziomie 918,9 mld zł.
        * **Status języka śląskiego** – Posłowie przegłosowali nadanie mowie śląskiej statusu języka regionalnego.
        * **Prawo do azylu** – Sejm wyraził zgodę na przedłużenie czasowego zawieszenia prawa do azylu na granicy.
        
        GENERUJ PONIŻEJ:
        """

        summary_data = self.gemini.generate_summary(context_str, title=f"Posiedzenie {sitting}")
        return summary_data.get('expert')

    def save_summary(self, term, sitting, summary):
        """Save the generated summary to the database."""
        query = """
            INSERT INTO sitting_summaries (term, sitting_number, summary_md, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (term, sitting_number) 
            DO UPDATE SET summary_md = EXCLUDED.summary_md, updated_at = NOW();
        """
        self.db.execute(query, (term, sitting, summary))
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
                self.save_summary(term, sitting, summary)
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
