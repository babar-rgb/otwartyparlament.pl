import logging
import time
import json
from dotenv import load_dotenv

# Load env before imports that might use it (though gemini.py loads at class init or module level)
load_dotenv("/Users/kajtek/sejm/git/parlament/.env")

import os
import google.generativeai as genai
from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteAnalysis
from backend.services.gemini import GeminiService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backfill")

# Manual configuration to ensure it works
key = os.getenv("GEMINI_API_KEY")
if key:
    logger.info(f"🔑 API Key loaded: {key[:5]}...{key[-3:]}")
    genai.configure(api_key=key)
else:
    logger.error("❌ API Key NOT found in environment after load_dotenv!")

def backfill_analyses(limit=127):
    db = SessionLocal()
    gemini = GeminiService()
    
    try:
        logger.info(f"🚀 Starting AI Analysis Backfill (Limit: {limit})")
        
        # 1. Find target votes (Term 10, Missing Analysis)
        # Using left outer join logic
        votes = db.query(Vote).outerjoin(VoteAnalysis).filter(
            Vote.term == 10,
            VoteAnalysis.vote_id == None
        ).limit(limit).all()
        
        logger.info(f"🎯 Found {len(votes)} votes to process.")
        
        count = 0
        for vote in votes:
            count += 1
            logger.info(f"[{count}/{len(votes)}] Processing Vote ID {vote.id}: {vote.title_clean[:50]}...")
            
            # Prepare Context
            bill_context = None
            
            # Strategy 1: Linked Bill
            if vote.bill:
                logger.info(f"   📄 Linked Bill Found (Relation): {vote.bill.number}")
                bill_context = f"Bill Title: {vote.bill.title}\nDescription: {vote.bill.description or ''}"
                if vote.bill.content:
                    bill_context += f"\nFull Text Snippet: {vote.bill.content[:10000]}"
            
            # Strategy 2: Regex extraction from Title (Find ALL prints)
            else:
                import re
                # Match all occurrences of numbers after "druki nr" or "druk nr"
                # This simplistic regex might miss some complex cases but catches standard "nr 123 i 456"
                print_nums = re.findall(r"\d+", vote.title_clean)
                
                # Filter reasonable numbers (e.g., 1-9999) to avoid years like 2026 if possible, 
                # but print numbers can be 2026 too. So we just trust relevant numbers closely following "nr".
                # Better regex: look for "nr" then capture numbers
                
                files_context = []
                
                # specific approach: find "nr X", "nr X i Y", "nr X, Y i Z"
                # simpler: just find all numbers that map to existing Bills in DB
                
                potential_nums = re.findall(r"\d+", vote.title_clean)
                from backend.models import Bill
                
                found_bills = db.query(Bill).filter(Bill.number.in_(potential_nums)).all()
                
                # --- AUTOMATIC CONTEXT EXPANSION ---
                # Check for Budget Law ("ustawa budżetowa") to find the massive "Mother Bill" (e.g. 1749)
                is_budget_related = "ustaw" in vote.title_clean.lower() and "budżet" in vote.title_clean.lower()
                
                extra_bills = []
                if is_budget_related:
                     logger.info("   💰 Budget-related vote detected! Searching for Base Budget Bill...")
                     # Search for "Rządowy projekt ustawy budżetowej" for the same year in title
                     # Extract year
                     import re
                     year_match = re.search(r"20\d\d", vote.title_clean)
                     year = year_match.group(0) if year_match else "2026"  # Default to 2026 if not found
                     
                     base_budget = db.query(Bill).filter(
                         Bill.title.ilike(f"%Rządowy projekt ustawy budżetowej na rok {year}%"),
                         Bill.type == "Rządowy"
                     ).first()
                     
                     if base_budget:
                         logger.info(f"   🏛️ FOUND MOTHER BUDGET BILL: {base_budget.number} (Context Expanded!)")
                         extra_bills.append(base_budget)
                
                # Context Assembly
                final_bills = found_bills + extra_bills
                # Deduplicate
                final_bills = list({b.id: b for b in final_bills}.values())

                if final_bills:
                     bill_context = "--- DOKUMENTY POWIĄZANE (CONTEXT) ---\n"
                     for fb in final_bills:
                         logger.info(f"   📄 Context Bill: {fb.number} - {fb.title}")
                         bill_context += f"\n>>> DOKUMENT {fb.number}: {fb.title} <<<\n"
                         bill_context += f"Opis: {fb.description or 'Brak'}\n"
                         if fb.content:
                             # Budget bill is huge, prioritize recent files (amendments) but give base
                             limit = 50000 
                             bill_context += f"Treść (fragment): {fb.content[:limit]}\n"
                         bill_context += "-" * 20 + "\n"
                else:
                    logger.warning(f"   ⚠️ No Bills found in DB for numbers: {potential_nums}")

            
            # 2. Call Gemini
            analysis_json = gemini.analyze_vote_expert(
                title=vote.title_clean,
                description=vote.description or "",
                bill_text=bill_context
            )
            
            if analysis_json:
                # Proceed to correct schema mapping below
                
                # Database Schema Alignment
                # VoteAnalysis has: summary, pros, cons, mind_map
                # Vote has: description, importance, topic
                
                # 1. Create Analysis Record (Upsert)
                existing_analysis = db.query(VoteAnalysis).filter_by(vote_id=vote.id).first()
                if existing_analysis:
                    logger.info(f"   ⚠️ Analysis already exists for Vote {vote.id}. Updating...")
                    existing_analysis.summary = analysis_json.get("summary")
                    existing_analysis.pros = analysis_json.get("pros") or []
                    existing_analysis.cons = analysis_json.get("cons") or []
                    existing_analysis.mind_map = json.dumps(analysis_json.get("personas"), ensure_ascii=False) if analysis_json.get("personas") else None
                else:
                    analysis = VoteAnalysis(
                        vote_id=vote.id,
                        summary=analysis_json.get("summary"),
                        pros=analysis_json.get("pros") or [],
                        cons=analysis_json.get("cons") or [],
                        mind_map=json.dumps(analysis_json.get("personas"), ensure_ascii=False) if analysis_json.get("personas") else None
                    )
                    db.add(analysis)
                
                # 2. Update Vote Metadata
                vote.description = analysis_json.get("summary")
                vote.importance = analysis_json.get("importance_score") or 0
                vote.topic = analysis_json.get("category")
                
                # --- LEGISLATIVE NETWORK LINKING (IDENTITY LINKER) ---
                # This logic groups related bills/votes into a single Process
                try:
                    from backend.models import LegislativeProcess, LegislativeStage
                    import uuid
                    
                    # Logic 1: Find if any of the context bills already belongs to a Process
                    process_id = None
                    if 'final_bills' in locals() and final_bills:
                        for fb in final_bills:
                            # We can't access fb.process_id yet because we haven't migrated Bill model to have process_id
                            # But we can query LegislativeStage to see if this bill number is already used
                            existing_stage = db.query(LegislativeStage).filter(LegislativeStage.bill_number == fb.number).first()
                            if existing_stage and existing_stage.process_id:
                                process_id = existing_stage.process_id
                                logger.info(f"   🔗 Found existing Process ID {process_id} via Bill {fb.number}")
                                break
                    
                    # Logic 2: If no process found, create new one
                    if not process_id:
                        process_id = str(uuid.uuid4())
                        # Title defaults to Vote Title or first Bill Title
                        proc_title = vote.title_clean.split(" o ")[0] if " o " in vote.title_clean else vote.title_clean[:100]
                        if 'final_bills' in locals() and final_bills:
                             proc_title = final_bills[0].title[:150] 
                        
                        new_process = LegislativeProcess(
                            id=process_id,
                            title=proc_title,
                            status="IN_PROGRESS",
                            start_date=vote.date
                        )
                        db.add(new_process)
                        logger.info(f"   🆕 Created NEW Legislative Process: {proc_title} ({process_id})")
                        
                        # Link context bills to this process as Initial Stages?
                        if 'final_bills' in locals():
                            for fb in final_bills:
                                stage = LegislativeStage(
                                    id=str(uuid.uuid4()),
                                    process_id=process_id,
                                    stage_type="BILL_REFERENCE",
                                    title=f"Druk {fb.number}",
                                    description=fb.title[:200],
                                    date=fb.date,
                                    bill_number=fb.number
                                )
                                db.add(stage)

                    # Logic 3: Link CURRENT VOTE as a Stage
                    vote_stage = LegislativeStage(
                        id=str(uuid.uuid4()),
                        process_id=process_id,
                        stage_type="VOTE",
                        title="Głosowanie w Sejmie",
                        description=vote.title_clean[:200],
                        date=vote.date,
                        vote_id=vote.id
                    )
                    db.add(vote_stage)
                    db.flush() # Ensure ID is generated/linked
                    logger.info(f"   📍 Linked Vote {vote.id} to Process {process_id}")

                    # --- PHASE 3: AI NARRATOR (Procedural Context) ---
                    try:
                        # 1. Fetch History
                        history_stages = db.query(LegislativeStage).filter(LegislativeStage.process_id == process_id).order_by(LegislativeStage.date).all()
                        history_text = "Historia Procesu Legislacyjnego:\n"
                        for st in history_stages:
                             history_text += f"- {st.date}: {st.stage_type} - {st.title}\n"
                        
                        # 2. Call Gemini
                        logger.info("   🧠 Generating Procedural Context...")
                        proc_json = gemini.analyze_expert(
                            title=vote.title_clean,
                            description=vote_stage.description,
                            bill_text=history_text, 
                            doc_type="process_context"
                        )
                        
                        if proc_json:
                             # 3. Save to VoteAnalysis
                             an = existing_analysis if existing_analysis else analysis
                             an.procedural_context = json.dumps(proc_json, ensure_ascii=False)
                             logger.info("   ✅ Procedural Context added.")
                    except Exception as e_narrator:
                        logger.error(f"   ⚠️ Failed to generate context: {e_narrator}")

                except Exception as link_e:
                    logger.error(f"   ⚠️ Failed to link legislative process: {link_e}")
                    # Don't fail the whole transaction, just log

                db.commit()
                logger.info("   ✅ Saved & Synced.")
                
                # Rate limit protection (Paid Tier: high limits, be nice)
                time.sleep(4) 
            else:
                logger.error("   ❌ Failed to generate analysis. Sleeping 60s...")
                time.sleep(60)
                
    except Exception as e:
        import traceback
        logger.error(f"Critical Error: {e}")
        logger.error(traceback.format_exc())
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    backfill_analyses()
