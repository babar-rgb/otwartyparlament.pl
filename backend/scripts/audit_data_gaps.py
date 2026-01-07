
import sys
import os
import logging
from sqlalchemy import text, func
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteResult, MP, Bill, BillAnalysis, Interpellation, InterpellationAuthor

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("audit")

def audit_term_10():
    session = SessionLocal()
    try:
        logger.info("=== AUDYT DANYCH (KADENCJA 10) ===")
        
        # 1. VOTES
        total_votes = session.query(Vote).filter(Vote.term == 10).count()
        votes_with_results = session.query(Vote.id).join(VoteResult).filter(Vote.term == 10).group_by(Vote.id).count()
        missing_votes = total_votes - votes_with_results
        
        logger.info(f"\n[GŁOSOWANIA]")
        logger.info(f"Total Votes: {total_votes}")
        logger.info(f"With Details: {votes_with_results}")
        logger.info(f"MISSING DETAILS: {missing_votes} ({missing_votes/total_votes*100:.1f}%)" if total_votes else "No votes")
        
        # 2. INTERPELLATIONS
        total_interpellations = session.query(Interpellation).count()
        
        # Count MPs with interpellations using the association table
        mps_count = session.query(MP).filter(MP.term == 10, MP.active == True).count()
        
        # Distinct MP IDs in InterpellationAuthor
        mps_with_interpellations = session.query(InterpellationAuthor.mp_id).distinct().count()
        mps_without = mps_count - mps_with_interpellations

        logger.info(f"\n[INTERPELACJE]")
        logger.info(f"Total Interpellations: {total_interpellations}")
        logger.info(f"MPs with Interpellations: {mps_with_interpellations}/{mps_count}")
        logger.info(f"MPs with ZERO: {mps_without}")
        
        # 3. BILLS / CONTEXT
        # Bill model might not have term directly
        total_bills = session.query(Bill).count()
        bills_with_analysis = session.query(BillAnalysis).join(Bill).count()
        
        logger.info(f"\n[USTAWY / KONTEKST]")
        logger.info(f"Total Bills: {total_bills}")
        logger.info(f"With AI Analysis: {bills_with_analysis}")
        logger.info(f"Missing Analysis: {total_bills - bills_with_analysis}")
        
        # 4. ASSET DECLARATIONS
        from backend.models import AssetDeclaration
        total_declarations = session.query(AssetDeclaration).count()
        mps_with_declarations = session.query(AssetDeclaration.mp_id).distinct().count()
        mps_without_decl = mps_count - mps_with_declarations
        
        logger.info(f"\n[OŚWIADCZENIA MAJĄTKOWE]")
        logger.info(f"Total Declarations: {total_declarations}")
        logger.info(f"MPs with at least one: {mps_with_declarations}/{mps_count}")
        logger.info(f"MPs w/o declarations: {mps_without_decl}")
        
        # 5. SPEECHES
        from backend.models import Speech
        total_speeches = session.query(Speech).filter(Speech.term == 10).count()
        # Check coverage by sitting
        # Get list of sittings from Votes or known range
        # Simple check: Distinct sittings in Speeches
        sittings_with_speeches = session.query(Speech.sitting).filter(Speech.term == 10).distinct().count()
        
        logger.info(f"\n[WYSTĄPIENIA]")
        logger.info(f"Total Speeches: {total_speeches}")
        logger.info(f"Sittings with Speeches: {sittings_with_speeches}")

        # 6. COMMITTEES
        from backend.models import Committee, CommitteeSitting
        total_committees = session.query(Committee).filter(Committee.term == 10).count()
        total_csittings = session.query(CommitteeSitting).filter(CommitteeSitting.term == 10).count()
        
        logger.info(f"\n[KOMISJE]")
        logger.info(f"Committees: {total_committees}")
        logger.info(f"Sittings recorded: {total_csittings} (Expected ~1000+)")

        # 7. EUROPARLAMENT
        from backend.models import EuroMEP, EuroVote
        total_eu_meps = session.query(EuroMEP).count()
        total_eu_votes = session.query(EuroVote).count()
        
        logger.info(f"\n[EUROPARLAMENT]")
        logger.info(f"MEPs: {total_eu_meps}")
        logger.info(f"Votes: {total_eu_votes}")
        logger.error(f"Audit failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    audit_term_10()
