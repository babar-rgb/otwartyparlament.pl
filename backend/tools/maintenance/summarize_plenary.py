import sys
import os
import logging
import time
from datetime import datetime

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import SittingAgenda, SittingSummary
from backend.services.gemini import GeminiService

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("summarize_plenary")

def run_plenary_summarization(term=10, limit=10, overwrite=False):
    session = SessionLocal()
    gemini = GeminiService()
    
    try:
        # Get distinct sitting numbers that don't have a summary yet
        sitting_numbers = session.query(SittingAgenda.sitting_number).filter(
            SittingAgenda.term == term
        ).distinct().all()
        
        sitting_numbers = [sn[0] for sn in sitting_numbers]
        
        logger.info(f"Checking {len(sitting_numbers)} plenary sittings for term {term}...")

        processed = 0
        for sn in sorted(sitting_numbers, reverse=True): # Newest first
            if processed >= limit: break
            
            existing = session.query(SittingSummary).filter(
                SittingSummary.sitting_number == sn,
                SittingSummary.term == term
            ).first()
            
            if existing and not overwrite: continue

            # Get all agenda points for this sitting
            points = session.query(SittingAgenda).filter(
                SittingAgenda.sitting_number == sn,
                SittingAgenda.term == term
            ).order_by(SittingAgenda.point_number).all()
            
            if not points: continue
            
            sitting_date = points[0].date if points[0].date else "Unknown"
            # Get unique bills/topics to reduce prompt size
            unique_points = {}
            for p in points:
                if p.title not in unique_points: unique_points[p.title] = p
            
            agenda_text = "\n".join([f"- {p.title} (Druk {p.print_number})" for p in unique_points.values()])
            
            logger.info(f"Summarizing Plenary Sitting #{sn} ({sitting_date})...")
            
            prompt = (
                "Jesteś starszym analitykiem politycznym i prawnym. Przeanalizuj agendę posiedzenia plenarnego Sejmu "
                "i przygotuj profesjonalną, konkretną kronikę wydarzeń.\n\n"
                "WYMAGANIA STYLISTYCZNE:\n"
                "- UNIKAJ INFANTYLIZMU. Nie pisz 'Komisja zajęła się...', 'O czym rozmawiano?'.\n"
                "- STYL: 'Situation Room' / Raport Wywiadowczy.\n"
                "- FORMAT: (Data posiedzenia) Tytuł/Wstęp. Następnie lista punktowa z kontekstem i skutkami.\n"
                "- SZCZEGÓŁY: Używaj konkretnych nazw ustaw, numerów druków i jeśli to możliwe - przewidywanych skutków.\n\n"
                f"Data: {sitting_date}\n"
                f"Siedzenie nr: {sn}\n"
                f"Agenda (punkty kluczowe):\n{agenda_text[:10000]}\n\n"
                "Przykład stylu:\n"
                "(8–9 stycznia 2026 r.) Pierwsze posiedzenie w nowym roku. Najważniejsze rozstrzygnięcia:\n"
                "- Ustawa budżetowa na 2026 rok (druk 15) – Sejm ostatecznie zamknął proces budżetowy, potwierdzając wydatki na wysokim poziomie.\n"
                "- Prawo do azylu (druk 2135) – przedłużenie czasowego zawieszenia prawa do azylu na odcinku granicy z Białorusią od 21 stycznia.\n\n"
                "Zwróć wynik jako Markdown."
            )

            try:
                model = gemini._get_model(gemini.model_flash)
                response = model.generate_content(prompt)
                
                if response and response.text:
                    if existing:
                        existing.summary_md = response.text
                        logger.info(f"🔄 Updated Sitting #{sn}")
                    else:
                        new_summary = SittingSummary(
                            term=term,
                            sitting_number=sn,
                            summary_md=response.text
                        )
                        session.add(new_summary)
                        logger.info(f"✅ Created Sitting #{sn}")
                    
                    session.commit()
                    processed += 1
                
                time.sleep(4) # Speed up slightly
                
            except Exception as e:
                logger.error(f"Error for #{sn}: {e}")
                session.rollback()

        logger.info(f"Finished. Summary count: {processed}")

    finally:
        session.close()

if __name__ == "__main__":
    limit = 5
    overwrite = False
    if "--force" in sys.argv:
        overwrite = True
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        limit = int(sys.argv[1])
        
    run_plenary_summarization(limit=limit, overwrite=overwrite)
