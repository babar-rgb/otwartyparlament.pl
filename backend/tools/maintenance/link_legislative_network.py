import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
import uuid
import re
import time
from datetime import datetime

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Bill, Vote, LegislativeProcess, LegislativeStage, LegislativeLink

def get_base_number(number):
    if not number: return None
    # Match base number (e.g. 123 from 123-A or 123-001)
    match = re.match(r'^(\d+)', number)
    return match.group(1) if match else None

def link_network():
    session = SessionLocal()
    try:
        # 1. Group bills by (term, base_number)
        logging.info("Pre-fetching bills...")
        all_bills = session.query(Bill).all()
        by_key = {} # Keyed by (term, base_number)
        for b in all_bills:
            base = get_base_number(b.number)
            if not base: continue
            key = (b.term or 10, base)
            if key not in by_key: by_key[key] = []
            by_key[key].append(b)

        logging.info(f"Found {len(by_key)} unique legislative processes (term + base).")

        # 2. Pre-fetch existing processes by (term, base_number)
        existing_processes = {
            (p.term, p.base_number): p 
            for p in session.query(LegislativeProcess).filter(
                LegislativeProcess.term != None, 
                LegislativeProcess.base_number != None
            ).all()
        }
        
        count = 0
        for (term, base), bills in by_key.items():
            count += 1
            # Sort bills by number length/suffix to find parent (originating bill)
            bills.sort(key=lambda x: len(x.number))
            parent_bill = bills[0]
            
            # Find or create a LegislativeProcess for this (term, base)
            process = existing_processes.get((term, base))
            
            if not process:
                # Check if any bill already has a process assigned (migration fallback)
                for b in bills:
                    if b.process_id:
                        process = session.query(LegislativeProcess).get(b.process_id)
                        if process:
                            process.term = term
                            process.base_number = base
                            break
            
            if not process:
                process_id = str(uuid.uuid4())
                process = LegislativeProcess(
                    id=process_id,
                    term=term,
                    base_number=base,
                    title=parent_bill.title or f"Proces legislacyjny - Druk {base} (Kadencja {term})",
                    status="IN_PROGRESS",
                    start_date=parent_bill.date
                )
                session.add(process)
                existing_processes[(term, base)] = process
                logging.info(f"[{count}/{len(by_key)}] Created process for {term}/{base}")
            else:
                # Ensure titles are updated if they were generic
                if "Proces legislacyjny" in process.title and parent_bill.title:
                    process.title = parent_bill.title

            for b in bills:
                b.process_id = process.id
                
                if b.number != base:
                    # Faster check for existing link
                    link_exists = session.query(LegislativeLink).filter(
                        LegislativeLink.source_bill == b.number,
                        LegislativeLink.target_bill == base
                    ).count() > 0
                    
                    if not link_exists:
                        # We should also consider term in links eventually, but for now base is unique enough per term
                        link = LegislativeLink(
                            source_bill=b.number,
                            target_bill=base,
                            relation_type="AMENDS" if "-A" in b.number or "-B" in b.number else "RELATED"
                        )
                        session.add(link)
                
                # Check for existing stage
                stage_exists = session.query(LegislativeStage).filter(
                    LegislativeStage.process_id == process.id,
                    LegislativeStage.bill_number == b.number
                ).count() > 0
                
                if not stage_exists:
                    stage = LegislativeStage(
                        id=str(uuid.uuid4()),
                        process_id=process.id,
                        stage_type="SUBMISSION" if b.number == base else "REPORT",
                        title=f"Druk nr {b.number}",
                        date=b.date or (parent_bill.date if parent_bill.date else datetime.now().date()),
                        bill_number=b.number
                    )
                    session.add(stage)

            # --- PRECISE VOTE LINKING ---
            # 1. Match by exact print_number (if available)
            # 2. Match by term AND title patterns
            related_votes = session.query(Vote).filter(
                Vote.term == term,
                (
                    (Vote.print_number == base) |
                    (Vote.title_raw.like(f"%druk% {base} %")) |
                    (Vote.title_raw.like(f"%druk nr {base}%")) |
                    (Vote.title_raw.like(f"%nr {base}%"))
                )
            ).all()

            # Filter out false positives if title based (e.g. "druk nr 123" vs "druk nr 1234")
            # The LIKE operator is a bit fuzzy, so we verify with regex if title based
            final_votes = []
            for v in related_votes:
                if v.print_number == base:
                    final_votes.append(v)
                else:
                    # Regex check for title: word boundary around base number
                    pattern = rf"(druk|nr)\s+({base})\b"
                    if re.search(pattern, v.title_raw, re.IGNORECASE):
                        final_votes.append(v)
            
            for vote in final_votes:
                vote.bill_id = parent_bill.id
                v_stage_exists = session.query(LegislativeStage).filter(
                    LegislativeStage.process_id == process.id,
                    LegislativeStage.vote_id == vote.id
                ).count() > 0
                
                if not v_stage_exists:
                    v_stage = LegislativeStage(
                        id=str(uuid.uuid4()),
                        process_id=process.id,
                        stage_type="VOTE",
                        title=f"Głosowanie: {vote.title_clean[:50]}..." if vote.title_clean else f"Głosowanie {vote.id}",
                        date=vote.date.date() if vote.date else datetime.now().date(),
                        vote_id=vote.id
                    )
                    session.add(v_stage)

            # --- AI DESCRIPTION GENERATION ---
            if not process.description or len(process.description) < 10:
                logging.info(f"Generating AI description for Process {term}/{base}...")
                try:
                    from backend.services.gemini import GeminiService
                    gemini = GeminiService()
                    
                    context_titles = list(set([b.title for b in bills if b.title] + [v.title_clean for v in final_votes if v.title_clean]))
                    if context_titles:
                        context_text = "\n".join(context_titles[:10])
                        
                        prompt = (
                            "Jesteś starszym analitykiem legislacyjnym. Na podstawie poniższych tytułów dokumentów "
                            "stwórz profesjonalny, konkretny opis całego procesu legislacyjnego.\n\n"
                            "WYMAGANIA:\n"
                            "- STYL: Ekspercki, bez zbędnych słów, 'Situation Room'.\n"
                            "- TREŚĆ: Co to za proces, jakie jest jego główne znaczenie prawne/polityczne.\n"
                            "- FORMAT: 2-3 zdania maks.\n\n"
                            f"Tytuły dokumentów:\n{context_text}\n\n"
                            "Zwróć wynik jako czysty tekst."
                        )
                        
                        model = gemini._get_model(gemini.model_flash)
                        response = model.generate_content(prompt)
                        if response and response.text:
                            process.description = response.text.strip()
                            logging.info(f"   [DESC] {process.description[:60]}...")
                except Exception as ai_e:
                    logging.info(f"AI Description Error: {ai_e}")

            if count % 20 == 0:
                session.commit()
                logging.info(f"--- Committed {count} processes ---")
                time.sleep(1)

        session.commit()
        logging.info(f"Linking complete. Total processes: {count}")

    except Exception as e:
        logging.info(f"Error linking network: {e}")
        session.rollback()
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    link_network()
