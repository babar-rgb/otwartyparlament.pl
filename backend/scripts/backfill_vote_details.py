
import sys
import os
import logging
import time
from sqlalchemy import func
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.orm_db import SessionLocal
from backend.models import Vote, VoteResult
from backend.utils.http import http_session

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("backfill.vote_results")

def backfill_vote_details():
    session = SessionLocal()
    try:
        # Find votes that have NO results in vote_results table
        # Subquery strategy for efficiency
        logger.info("🔍 Searching for votes with missing results...")
        
        votes_missing = session.query(Vote).outerjoin(VoteResult).group_by(Vote.id).having(func.count(VoteResult.id) == 0).all()
        
        logger.info(f"found {len(votes_missing)} votes to backfill.")
        
        count = 0
        for vote in votes_missing:
            # API: /votings/{term}/{sitting}/{votingNumber}
            url = f"https://api.sejm.gov.pl/sejm/term{vote.term}/votings/{vote.sitting}/{vote.voting_number}"
            
            try:
                resp = http_session.get(url, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    results = data.get('votes', [])
                    
                    if not results:
                        logger.warning(f"⚠️ Vote {vote.id}: No mpVotes in API either (maybe consensus?)")
                        continue
                        
                    new_results = []
                    for r in results:
                        # Map API response to DB model
                        vr = VoteResult(
                            vote_id=vote.id,
                            mp_id=r.get('MP'), # API key is 'MP'
                            result=r.get('vote') # DB column is 'result', 'vote' is relationship
                        )
                        new_results.append(vr)
                    
                    session.bulk_save_objects(new_results)
                    session.commit()
                    count += 1
                    if count % 20 == 0:
                        logger.info(f"✅ Backfilled {count}/{len(votes_missing)} votes")
                        
                elif resp.status_code == 404:
                    logger.warning(f"❌ 404 for Vote {vote.id} (Sitting {vote.sitting}/{vote.voting_number})")
            
            except Exception as e:
                logger.error(f"Error {vote.id}: {e}")
                session.rollback()
            
            time.sleep(0.1) # Be nice to API

        logger.info(f"🎉 Done. Backfilled {count} votes.")

    finally:
        session.close()

if __name__ == "__main__":
    backfill_vote_details()
