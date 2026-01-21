import sys
import os
import logging
import time
import json
import re

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import CommitteeSitting
from backend.services.gemini import GeminiService

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("summarize_sittings")

def clean_html(text):
    if not text: return ""
    # Remove HTML tags
    clean = re.sub(r'<.*?>', '', text)
    # Remove excessive whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean

def run_summarization(limit=100):
    session = SessionLocal()
    gemini = GeminiService()
    
    try:
        # Find sittings with agenda but no summary
        sittings = session.query(CommitteeSitting).filter(
            CommitteeSitting.agenda != None,
            CommitteeSitting.summary == None
        ).limit(limit).all()

        logger.info(f"Found {len(sittings)} sittings to summarize.")

        for s in sittings:
            agenda_cleaned = clean_html(str(s.agenda))
            if not agenda_cleaned or len(agenda_cleaned) < 5:
                s.summary = "Brak szczegółowej agendy do analizy."
                session.commit()
                continue

            logger.info(f"Summarizing {s.committee_code} #{s.sitting_number}...")
            
            prompt = (
                "Działasz jako Ekspert Legislacyjny Kancelarii Sejmu. Tworzysz 'Raport Stanu' z posiedzenia komisji.\n"
                "ZADANIE: Przeanalizuj agendę i stwórz ultra-zwięzłe, merytoryczne podsumowanie.\n\n"
                "WYMAGANIA ABSOLUTNE (STRICT MODE):\n"
                "1. JĘZYK: Formalny, suchy, prawniczy. ŻADNYCH emocji, żargonu marketingowego czy 'storytellingu'.\n"
                "2. ZAKAZ: Nie używaj słów: 'kluczowe', 'ważne', 'przełomowe', 'sytuacja'.\n"
                "3. STRUKTURA: \n"
                "   **(Data/Nr posiedzenia)**\n"
                "   - [Decyzja/Akcja] Tytuł ustawy/punktu (Druk nr X).\n"
                "   - Konkretny skutek prawny (np. 'Skierowano do II czytania', 'Przyjęto poprawki redakcyjne').\n\n"
                f"Agenda źródłowa:\n{agenda_cleaned}\n\n"
                "Zwróć wynik jako Markdown."
            )

            try:
                # Using generate_content directly or build a wrapper in GeminiService
                # For now, let's assume GeminiService._get_model works.
                model = gemini._get_model(gemini.model_flash)
                response = model.generate_content(prompt)
                
                if response and response.text:
                    s.summary = response.text
                    logger.info(f"✅ Success: {s.committee_code} #{s.sitting_number}")
                else:
                    logger.warning(f"⚠️ Empty response for {s.committee_code} #{s.sitting_number}")
                
                session.commit()
                # Rate limiting delay
                time.sleep(5) 
                
            except Exception as e:
                logger.error(f"Error calling Gemini: {e}")
                if "429" in str(e):
                    logger.warning("Rate limit hit, sleeping 60s...")
                    time.sleep(60)
                session.rollback()

        logger.info("Summarization task finished.")

    except Exception as e:
        logger.error(f"Main loop error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    limit = 50
    if len(sys.argv) > 1:
        limit = int(sys.argv[1])
    run_summarization(limit=limit)
