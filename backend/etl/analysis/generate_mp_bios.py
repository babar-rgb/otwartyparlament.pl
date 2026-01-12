import sys
import os
import time
import json
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from backend.core.db import db
    from backend.services.ollama import ollama_service
    from backend.core.logger import get_logger
except ImportError:
    # Fallback for running from root
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from core.db import db
    from services.ollama import ollama_service
    from core.logger import get_logger

logger = get_logger("etl.biographies")

class BiographyGenerator:
    def __init__(self, term=10):
        self.term = term

    def get_mp_stats(self, mp_id):
        """Fetch stats for prompt context."""
        stats = {}
        with db.get_cursor() as cur:
            # 1. Projects count
            # TODO: Link bills to MPs. Currently 'bills' table doesn't have authors.
            stats["projects_count"] = "Brak danych"

            # 2. Voting attendance
            try:
                cur.execute("""
                    SELECT 
                        COUNT(*) FILTER (WHERE r.result = 'YES' OR r.result = 'NO' OR r.result = 'ABSTAIN') as total_votes,
                        COUNT(*) FILTER (WHERE r.result = 'ABSENT') as absent
                    FROM vote_results r
                    JOIN votes v ON r.vote_id = v.id
                    WHERE r.mp_id = %s AND v.term = %s
                """, (mp_id, self.term))
                vote_stats = cur.fetchone()
                if vote_stats and vote_stats['total_votes'] and (vote_stats['total_votes'] + vote_stats['absent']) > 0:
                    total = vote_stats['total_votes'] + vote_stats['absent']
                    stats["attendance"] = round((vote_stats['total_votes'] / total) * 100, 2)
                else:
                    stats["attendance"] = 0
            except Exception as e:
                logger.error(f"Error fetching vote stats: {e}")
                stats["attendance"] = "Brak danych"

        attendance_str = f"Frekwencja: {stats['attendance']}%"
        projects_str = ""
        if stats['projects_count'] != "Brak danych":
             projects_str = f", Liczba projektów: {stats['projects_count']}"
        
        return f"- {attendance_str}{projects_str}"

    def run(self):
        logger.info(f"Starting Biography Generation for Term {self.term}")
        
        # Get IDs first
        with db.get_cursor() as cur:
            cur.execute("""
                SELECT id, first_name, last_name, club, profession, birth_date, birth_location, education_level, education_history 
                FROM mps 
                WHERE term = %s 
                AND (biography IS NULL OR biography = '')
                ORDER BY id ASC
            """, (self.term,))
            mps = cur.fetchall()
            
        logger.info(f"Found {len(mps)} MPs without biography.")
        
        count = 0
        for mp in mps:
            mp_id = mp['id']
            # Safe name formatting
            parts = [str(mp.get('first_name') or ''), str(mp.get('last_name') or '')]
            name = " ".join([p for p in parts if p]).strip()
            logger.info(f"Generating bio for {name} ({count+1}/{len(mps)})...")
            
            # Get stats
            stats_summary = self.get_mp_stats(mp_id)
            
            # Generate Bio
            bio = ollama_service.generate_mp_bio(mp, stats_summary)
            
            if bio:
                # Save to DB - New Transaction per MP
                with db.get_cursor(commit=True) as cur:
                    cur.execute("""
                        UPDATE mps 
                        SET biography = %s 
                        WHERE id = %s
                    """, (bio, mp_id))
                logger.info(f"Saved bio for {name}.")
            else:
                logger.warning(f"Failed to generate bio for {name}.")
            
            count += 1
            # Sleep to limit load
            time.sleep(1) 

if __name__ == "__main__":
    generator = BiographyGenerator()
    generator.run()
