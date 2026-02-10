import logging
logging.basicConfig(level=logging.INFO)
import sys
import os
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend.core.db import db
    from backend.services.ollama import ollama_service
    from backend.core.logger import get_logger
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from core.db import db
    from core.logger import get_logger

logger = get_logger("audit.votes")

def audit_missing_results():
    logger.info("🔍 Starting audit of missing vote results...")
    
    with db.get_cursor() as cur:
        # Find votes that exist in 'votes' but have 0 rows in 'vote_results'
        # We use a LEFT JOIN where joined ID is NULL
        # This is efficient for finding orphans
        
        sql = """
            SELECT v.id, v.term, v.sitting, v.voting_number, v.date, v.title_clean
            FROM votes v
            LEFT JOIN vote_results vr ON v.id = vr.vote_id
            WHERE vr.mp_id IS NULL
            ORDER BY v.date DESC
        """
        
        cur.execute(sql)
        missing_votes = cur.fetchall()
        
        logger.info(f"👉 Found {len(missing_votes)} votes with NO results data.")
        
        if len(missing_votes) > 0:
            logger.info("Sample of missing votes:")
            for v in missing_votes[:10]:
                logger.info(f" - ID: {v['id']} | Term: {v['term']} | Sit: {v['sitting']} | No: {v['voting_number']} | Date: {v['date']}")
                
            # Group by Sitting to see where the problem is
            sittings = {}
            for v in missing_votes:
                key = f"Term {v['term']} Sitting {v['sitting']}"
                sittings[key] = sittings.get(key, 0) + 1
            
            logger.info("\nProblems by Sitting:")
            for s, count in sorted(sittings.items()):
                logger.info(f" - {s}: {count} empty votes")
                
            # Export list for repair script
            missing_ids = [v['id'] for v in missing_votes]
            with open("missing_votes_ids.json", "w") as f:
                json.dump(missing_ids, f)
            logger.info(f"\nSaved {len(missing_ids)} IDs to missing_votes_ids.json")

    logger.info("Audit complete.")

if __name__ == "__main__":
    audit_missing_results()
