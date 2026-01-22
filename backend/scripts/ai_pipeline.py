import sys
import os
import argparse
import time
import json
import logging

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, Bill, VoteAnalysis
from backend.services.gemini import gemini_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_pipeline(limit=10, force=False, term=10):
    session = SessionLocal()
    try:
        # 1. Selection Strategy: Process everything in the term
        query = session.query(Vote).filter(
            Vote.term == term
        )
        
        # 2. Checkpointing Strategy: Skip votes that already have a good 'title_clean' 
        # (Optional: or missing VoteAnalysis for full expert run)
        if not force:
            query = query.filter(
                (Vote.title_clean == None) | (Vote.title_clean == "") | (Vote.title_clean.like("Pkt. %")) | (Vote.title_clean.like("Punkt %"))
            )
            
        # Order by newest first
        votes = query.order_by(Vote.date.desc(), Vote.voting_number.desc()).limit(limit).all()
        
        print(f"🚀 Starting AI Pipeline Refresh for {len(votes)} votes (Term {term})...")
        
        success_count = 0
        for i, vote in enumerate(votes):
            print(f"[{i+1}/{len(votes)}] --- Vote ID: {vote.id} ({vote.date}) ---")
            # Improved Bill Linking Strategy
            content = ""
            bill = vote.bill
            
            # If no direct link, try to find by print number
            if not bill:
                import re
                # Try to extract from title
                match = re.search(r'druki? nr (\d+)', vote.title_raw or "", re.IGNORECASE)
                if match:
                    print_nr = match.group(1)
                    bill = session.query(Bill).filter(Bill.number == print_nr).first()
                    # Optional: We could update the link here, but let's just use it for now
            
            if bill:
                content = bill.content
            
            # Fallback: Check description if content is empty (sometimes description has key info)
            if not content and vote.description:
                # Heuristic: If description is long, treat it as content
                if len(vote.description) > 200:
                    content = vote.description

            try:
                # STEP 1: Human Title
                print("   Generating human title...")
                # Use retry logic for Gemini
                new_title = None
                for attempt in range(3):
                    try:
                        new_title = gemini_service.generate_simple_title(
                            original_title=vote.title_raw or "Głosowanie",
                            description=vote.description or "",
                            bill_content=content
                        )
                        if new_title: break
                    except Exception as ge:
                        if "429" in str(ge):
                            wait_time = (attempt + 1) * 30
                            print(f"   Resource exhausted (429). Waiting {wait_time}s...")
                            time.sleep(wait_time)
                        else:
                            raise ge
                
                if not new_title:
                    print("   ❌ Failed to generate title after retries.")
                    continue

                vote.title_clean = new_title
                print(f"   [TITLE] {new_title}")
                
                # STEP 2 & 3: Dual Summary & Pros/Cons (Only if content exists)
                if content and len(content) > 100:
                    print("   Generating analysis (Dual Summary, Pros/Cons)...")
                    summaries = gemini_service.generate_summary(content, title=new_title)
                    pc = gemini_service.generate_pros_cons(content)
                    
                    # Robustness: Handle if Gemini returns a list instead of a dict
                    if isinstance(summaries, list) and len(summaries) > 0:
                        summaries = summaries[0]
                    if not isinstance(summaries, dict):
                        summaries = {"simple": str(summaries), "expert": str(summaries)}

                    if isinstance(pc, list) and len(pc) > 0:
                        pc = pc[0]
                    if not isinstance(pc, dict):
                        pc = {"pros": [], "cons": [], "confidence_score": 0}

                    # Save to VoteAnalysis
                    analysis = session.query(VoteAnalysis).filter(VoteAnalysis.vote_id == vote.id).first()
                    if not analysis:
                        analysis = VoteAnalysis(vote_id=vote.id)
                    
                    # Ensure we have strings
                    analysis.summary = str(summaries.get("simple", ""))
                    analysis.summary_expert = str(summaries.get("expert", ""))
                    analysis.pros = pc.get("pros", [])
                    analysis.cons = pc.get("cons", [])
                    analysis.analysis_metadata = {
                        "confidence_score": pc.get("confidence_score"),
                        "expert_comment": pc.get("expert_comment"),
                        "model": "gemini-2.0-flash",
                        "processed_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    }
                    session.add(analysis)
                else:
                    print("   ⏩ Skipping analysis (missing/short content).")
                # STEP 4: SEO Metadata (Language of the Street)
                print("   Generating SEO metadata...")
                seo_data = gemini_service.generate_seo_metadata(
                    vote.title_clean or vote.title_raw, 
                    vote.description or "", 
                    content
                )
                
                # Check if it returned a list or dict (handle strict JSON parsing issues)
                if isinstance(seo_data, list) and len(seo_data) > 0:
                    seo_data = seo_data[0]
                    
                if isinstance(seo_data, dict):
                    vote.street_title = seo_data.get("street_title")
                    vote.meta_description = seo_data.get("meta_description")
                    vote.seo_keywords = seo_data.get("keywords")
                    print(f"   [SEO] {vote.street_title}")
                
                session.commit()
                success_count += 1
                print(f"   ✅ Saved. [CS] {pc.get('confidence_score')}%")
                
                # Rate limit control (Gemini Flash free tier is tight)
                time.sleep(10)

            except Exception as e:
                print(f"   ❌ Error at Vote {vote.id}: {e}")
                session.rollback()
                if "429" in str(e):
                    print("   Critical rate limit. Sleeping for 60s...")
                    time.sleep(60)

        print(f"\n✅ Pipeline finished. Successfully processed {success_count} votes.")

    except Exception as e:
        print(f"Global Pipeline Error: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--force", action="store_true", help="Reprocess already analyzed votes")
    parser.add_argument("--term", type=int, default=10, help="Parliamentary term to process")
    args = parser.parse_args()
    
    if not os.getenv("GEMINI_API_KEY"):
        print("Error: GEMINI_API_KEY is missing!")
        sys.exit(1)
        
    run_pipeline(limit=args.limit, force=args.force, term=args.term)
