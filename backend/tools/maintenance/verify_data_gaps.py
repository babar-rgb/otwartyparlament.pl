
import sys
import os
import logging
from sqlalchemy import text, func

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Speech, AssetDeclaration, Vote, VoteResult

# Configure concise logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("verification")

def verify_data():
    session = SessionLocal()
    try:
        logging.info("\n🔎 VERIFYING DATA COMPLETENESS 🔎\n")

        # 1. SPEECHES
        logging.info("--- 1. SPEECHES (Wystąpienia) ---")
        total_speeches = session.query(Speech).count()
        # Column is 'content', not 'transcript'
        speeches_with_content = session.query(Speech).filter(Speech.content != None, Speech.content != '').count()
        coverage_speeches = (speeches_with_content / total_speeches * 100) if total_speeches > 0 else 0
        
        logging.info(f"Total Speeches: {total_speeches}")
        logging.info(f"With Content: {speeches_with_content}")
        logging.info(f"Coverage: {coverage_speeches:.2f}%")
        if coverage_speeches >= 99.9:
            logging.info("✅ VERIFIED (Claim: 100%)")
        else:
            logging.info(f"⚠️ MISMATCH (Claim: 100%, Actual: {coverage_speeches:.2f}%)")

        logging.info("\n")

        # 2. ASSET DECLARATIONS
        logging.info("--- 2. ASSET DECLARATIONS (Oświadczenia) ---")
        total_assets = session.query(AssetDeclaration).count()
        # Check parsed_content JSONB
        assets_parsed = session.query(AssetDeclaration).filter(AssetDeclaration.parsed_content != None).count()
        coverage_assets = (assets_parsed / total_assets * 100) if total_assets > 0 else 0
        
        logging.info(f"Total Declarations: {total_assets}")
        logging.info(f"Parsed (JSON): {assets_parsed}")
        logging.info(f"Coverage: {coverage_assets:.2f}%")
        
        if coverage_assets >= 95.0:
             logging.info("✅ VERIFIED (Claim: 95%)")
        else:
             logging.info(f"⚠️ MISMATCH (Claim: 95%, Actual: {coverage_assets:.2f}%)")

        # 3. VOTES
        logging.info("--- 3. VOTES (Głosowania) ---")
        total_votes = session.query(Vote).count()
        # Count votes that have at least one VoteResult
        votes_with_results = session.query(Vote.id).join(VoteResult).group_by(Vote.id).count() 
        # Note: The above might be slow on huge DB. 
        # Better: Count distinct vote_ids in vote_results table.
        distinct_vote_results = session.query(func.count(func.distinct(VoteResult.vote_id))).scalar()
        
        
        coverage_votes = (distinct_vote_results / total_votes * 100) if total_votes > 0 else 0
        
        logging.info(f"Total Votes: {total_votes}")
        logging.info(f"Votes with Results: {distinct_vote_results}")
        logging.info(f"Coverage: {coverage_votes:.2f}%")
        
        if coverage_votes >= 99.0: # Allow small margin for recent syncs
             logging.info("✅ VERIFIED (Claim: Complete)")
        else:
             missing = total_votes - distinct_vote_results
             logging.info(f"⚠️ MISMATCH (Claim: Complete, Actual: {coverage_votes:.2f}%, Missing: {missing})")

    except Exception as e:
        logging.info(f"❌ Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    verify_data()
