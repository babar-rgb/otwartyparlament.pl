import logging
import re
from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill
from backend.services.gemini import GeminiService

# Setup minimal logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debug_prompt")

def debug_prompt(vote_id=490049):
    db = SessionLocal()
    gemini = GeminiService()
    
    vote = db.query(Vote).filter(Vote.id == vote_id).first()
    if not vote:
        print("Vote not found")
        return

    print(f"--- ANALY ZING VOTE: {vote.title_clean} ---")
    
    # --- REPLICATE LOGIC FROM backfill_analyses.py ---
    
    # 1. Regex Match
    print_nums = re.findall(r"\d+", vote.title_clean)
    potential_nums = print_nums # simplify
    
    print(f"Potential Nums: {potential_nums}")
    
    found_bills = db.query(Bill).filter(Bill.number.in_(potential_nums)).all()
    
    # 2. Mother Bill
    is_budget_related = "ustaw" in vote.title_clean.lower() and "budżet" in vote.title_clean.lower()
    extra_bills = []
    if is_budget_related:
         year_match = re.search(r"20\d\d", vote.title_clean)
         year = year_match.group(0) if year_match else "2026"
         base_budget = db.query(Bill).filter(
             Bill.title.ilike(f"%Rządowy projekt ustawy budżetowej na rok {year}%"),
             Bill.type == "Rządowy"
         ).first()
         if base_budget:
             extra_bills.append(base_budget)

    final_bills = found_bills + extra_bills
    final_bills = list({b.id: b for b in final_bills}.values()) # Dedupe

    bill_context = ""
    if final_bills:
         bill_context = "--- DOKUMENTY POWIĄZANE (CONTEXT) ---\n"
         for fb in final_bills:
             bill_context += f"\n>>> DOKUMENT {fb.number}: {fb.title} <<<\n"
             bill_context += f"Opis: {fb.description or 'Brak'}\n"
             if fb.content:
                 limit = 50000 
                 bill_context += f"Treść (fragment): {fb.content[:limit]}\n"
             else:
                 bill_context += "Treść: [BRAK W BAZIE]\n"
             bill_context += "-" * 20 + "\n"

    # 3. Build Prompt
    # We call the internal method _build_prompt to see what goes out
    complexity = gemini._assess_complexity(vote.title_clean, vote.description or "", bill_context)
    prompt = gemini._build_prompt(vote.title_clean, vote.description or "", bill_context, complexity)
    
    print("\n" + "="*40)
    print("FINAL PROMPT SENT TO AI:")
    print("="*40)
    print(prompt[:5000]) # First 5k chars
    print("..." + "="*40)
    print(f"Total Prompt Length: {len(prompt)} chars")
    
    db.close()

if __name__ == "__main__":
    debug_prompt()
