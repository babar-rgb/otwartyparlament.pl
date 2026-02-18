import os
import sys
import logging
import google.generativeai as genai
from sqlalchemy import text
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.core.orm_db import SessionLocal
from backend.services.gemini import GeminiService

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("street_titles")

# Initialize Gemini
gemini = GeminiService()

def generate_title(raw_title, context):
    """
    Generate a user-friendly street title using Gemini.
    """
    if not context:
        context = "Brak dodatkowego streszczenia."

    prompt = f"""
    Jesteś ekspertem od komunikacji politycznej. Twoim zadaniem jest zamiana technicznego, sejmowego tytułu głosowania na krótki, "uliczny", zrozumiały dla każdego obywatela tytuł (3-7 słów) po polsku.

    OFICJALNY TYTUŁ SEJMOWY:
    "{raw_title}"

    KONTEKST (Streszczenie ustawy/druku):
    "{context}"

    ZASADY:
    1. Tytuł musi być zwięzły (3-7 słów).
    2. Musi oddawać ISTOTĘ sprawy (np. "Podwyżki dla nauczycieli", "Nowy podatek od plastiku", "Przedłużenie pomocy dla Ukrainy").
    3. Nie używaj fraz typu "Pkt. 20", "Głosowanie nad...", "Sprawozdanie Komisji...".
    4. Jeśli głosowanie dotyczy konkretnej poprawki, spróbuj ująć czego ona dotyczy, jeśli kontekst na to pozwala. Jeśli nie, trzymaj się głównego tematu ustawy.
    5. Zwróć TYLKO i WYŁĄCZNIE wygenerowany tytuł. Żadnych komentarzy.

    TYTUŁ:
    """
    
    try:
        if not gemini.model:
            logger.error("Gemini model not initialized.")
            return None
        response = gemini.model.generate_content(prompt)
        if response and response.text:
            return response.text.strip().strip('"')
        return None
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return None

def main(limit=50):
    db = SessionLocal()
    try:
        # Query votes that need titles, joining with BillAnalysis and SejmPrint for deep context
        query = text("""
            SELECT 
                v.id, 
                v.title_raw, 
                v.title_clean,
                COALESCE(ba.summary, sp.summary) as context
            FROM votes v
            LEFT JOIN bills b ON v.bill_id = b.id
            LEFT JOIN bill_analyses ba ON b.id = ba.bill_id
            LEFT JOIN sejm_prints sp ON v.print_number = sp.number
            WHERE v.street_title IS NULL 
               OR v.street_title = '' 
               OR v.street_title LIKE 'Pkt %'
               OR v.street_title LIKE 'Głosowanie nr %'
            ORDER BY v.date DESC
            LIMIT :limit
        """)
        
        results = db.execute(query, {"limit": limit}).fetchall()
        
        if not results:
            logger.info("No votes found that need street titles.")
            return

        logger.info(f"Processing {len(results)} votes for street titles...")
        
        updated_count = 0
        for row in results:
            vote_id, title_raw, title_clean, context = row
            
            # Use title_clean as primary input if available, else title_raw
            input_title = title_clean or title_raw
            
            logger.info(f"Generating title for Vote {vote_id}: {input_title[:50]}...")
            
            new_title = generate_title(input_title, context)
            
            if new_title:
                logger.info(f"  Result: {new_title}")
                db.execute(
                    text("UPDATE votes SET street_title = :title WHERE id = :id"),
                    {"title": new_title, "id": vote_id}
                )
                updated_count += 1
            else:
                logger.warning(f"  Failed to generate title for Vote {vote_id}")
                
        db.commit()
        logger.info(f"Batch complete. Successfully updated {updated_count} street titles.")
        
    except Exception as e:
        logger.error(f"Error in main loop: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate AI Street Titles for votes.")
    parser.add_argument("--limit", type=int, default=50, help="Number of votes to process in this batch.")
    args = parser.parse_args()
    
    main(limit=args.limit)
