
import logging
import json
import time
from sqlalchemy import text
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from backend.core.db import db
from backend.utils.http import http_session
from backend.models import Vote, VoteResult
from backend.core.orm_db import SessionLocal

logger = logging.getLogger("etl.vote_results")

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

class ResultsETL:
    def __init__(self):
        pass

    def run(self, limit=100, force_sitting=None):
        """
        Fetches detailed results for votes that are missing them.
        """
        logger.info("Starting Vote Results ETL...")
        session = SessionLocal()
        
        try:
            # Find votes without results
            # We assume if a vote has no entries in vote_results, it needs fetching.
            # However checking count for every vote is expensive.
            # Better strategy: Get recent votes and check if they have results.
            
            query = session.query(Vote).order_by(Vote.date.desc())
            
            if force_sitting:
                query = query.filter(Vote.sitting == force_sitting)
            
            votes_to_check = query.limit(limit).all()
            
            processed = 0
            for vote in votes_to_check:
                # Check if we already have results
                # A simple way is to check if any VoteResult exists for this vote_id
                # But we can also check a flag if we had one. We don't.
                # Let's count.
                existing_count = session.query(VoteResult).filter(VoteResult.vote_id == vote.id).count()
                
                if existing_count > 0 and not force_sitting:
                    continue
                    
                logger.info(f"Fetching results for Vote {vote.id} (Sitting {vote.sitting}, No {vote.voting_number})...")
                
                # Fetch from API
                url = f"{SEJM_API_URL}/votings/{vote.sitting}/{vote.voting_number}"
                resp = http_session.get(url, timeout=10)
                
                if resp.status_code != 200:
                    if resp.status_code == 404:
                        logger.warning(f"API Returned 404 for {url}. This is expected for recent votes - Sejm API has not published details yet (Eventual Consistency).")
                    else:
                        logger.error(f"Failed to fetch {url}: {resp.status_code}")
                    continue
                    
                data = resp.json()
                votes_list = data.get('votes', [])
                
                if not votes_list:
                    logger.warning(f"No votes found in API response for {vote.id}")
                    continue
                
                # Prepare bulk insert
                # Map: 1: 'YES', 2: 'NO', 3: 'ABSTAIN', 4: 'ABSENT'
                # Note: API might return string values or ints. Documentation says ints usually.
                # Let's verify mapping commonly used.
                
                new_results = []
                for v in votes_list:
                    mp_id = v.get('MP')
                    res = v.get('vote') # 1, 2, 3, 4
                    
                    if not mp_id: 
                        continue
                        
                    res_str = 'ABSENT'
                    # Handle both Integer and String responses from API
                    if res == 1 or res == 'YES': res_str = 'YES'
                    elif res == 2 or res == 'NO': res_str = 'NO'
                    elif res == 3 or res == 'ABSTAIN': res_str = 'ABSTAIN'
                    elif res == 4 or res == 'ABSENT': res_str = 'ABSENT'
                    
                    # Also handle list updates? No, just insert.
                    # Delete existing if force_sitting?
                    if existing_count > 0:
                        # If we are refetching, we should probably clear old ones to avoid dupes if logic fails
                        # But for now assuming clean insert
                        pass

                    new_results.append({
                        "mp_id": mp_id,
                        "vote_id": vote.id,
                        "result": res_str
                    })
                
                if new_results:
                    # Clear existing to be safe (if partial)
                    session.execute(text("DELETE FROM vote_results WHERE vote_id = :vid"), {"vid": vote.id})
                    
                    # Bulk insert
                    session.execute(
                        text("INSERT INTO vote_results (mp_id, vote_id, result) VALUES (:mp_id, :vote_id, :result)"),
                        new_results
                    )
                    session.commit()
                    processed += 1
                    
                time.sleep(0.1) # Nice to API
                
            logger.info(f"Results ETL complete. Processed {processed} votes.")
            
        except Exception as e:
            logger.error(f"Results ETL failed: {e}")
            session.rollback()
        finally:
            session.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--sitting", type=int, help="Force specific sitting")
    args = parser.parse_args()
    
    ResultsETL().run(limit=args.limit, force_sitting=args.sitting)
