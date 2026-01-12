"""
Stats ETL for otwartyparlament.pl
Calculates derived statistics (Attendance, Rebellion) for MPs.
"""
from backend.core.db import db
from backend.core.logger import get_logger

logger = get_logger("etl.stats")

def calculate_stats():
    logger.info("Starting Statistics Calculation...")
    
    with db.get_cursor(commit=True) as cur:
        # 1. Attendance
        logger.info("Calculating Attendance...")
        # Formula: (Votes Present / Total Votes) * 100
        # Present = result IN ('YES', 'NO', 'ABSTAIN', 'PRESENT')
        
        # A. Fetch stats (Corrected for Term)
        cur.execute("""
            SELECT 
                vr.mp_id,
                COUNT(*) as total,
                COUNT(CASE WHEN vr.result IN ('YES', 'NO', 'ABSTAIN', 'PRESENT') THEN 1 END) as present
            FROM vote_results vr
            JOIN votes v ON vr.vote_id = v.id
            JOIN mps m ON vr.mp_id = m.id
            WHERE v.term = m.term -- Filter by term
            GROUP BY vr.mp_id
        """)
        rows = cur.fetchall()
        
        # B. Calculate in Python
        updates = []
        for r in rows:
            if r['total'] > 0:
                pct = round((r['present'] / r['total']) * 100, 2)
            else:
                pct = 0
            updates.append((pct, r['mp_id']))
            
        # C. Update DB
        if updates:
            logger.info(f"Updating attendance for {len(updates)} MPs...")
            cur.executemany("UPDATE mps SET stats_attendance = %s WHERE id = %s", updates)
        logger.info("Attendance calculated and updated.")
        
        # 2. Rebellion (Indywidualizm)
        # Definition: Votes where MP result != Club Majority result
        logger.info("Calculating Rebellion (Simplistic)...")
        
        # Temp table for club consensus
        cur.execute("CREATE TEMP TABLE club_consensus AS SELECT vote_id, club, result, count(*) as cnt FROM vote_results JOIN mps ON vote_results.mp_id = mps.id GROUP BY vote_id, club, result")
        
        cur.execute("""
            CREATE TEMP TABLE club_winners AS
            SELECT DISTINCT ON (vote_id, club) vote_id, club, result as majority_result
            FROM club_consensus
            ORDER BY vote_id, club, cnt DESC
        """)
        
        # Count Rebellions
        sql_rebellion = """
            WITH rebellions AS (
                SELECT 
                    vr.mp_id,
                    COUNT(*) as rebellion_count
                FROM vote_results vr
                JOIN mps m ON vr.mp_id = m.id
                JOIN votes v ON vr.vote_id = v.id -- Join to check term
                JOIN club_winners cw ON vr.vote_id = cw.vote_id AND m.club = cw.club
                WHERE vr.result != cw.majority_result
                  AND vr.result IN ('YES', 'NO', 'ABSTAIN') -- Only active votes count as rebellion
                  AND cw.majority_result IN ('YES', 'NO', 'ABSTAIN') -- Comparing only against active club stance
                  AND v.term = m.term -- CRITICAL: Only count votes from the MP's term
                  AND m.club NOT IN ('niez.', 'niezrzeszeni', 'Niezrzeszeni', 'niez', 'niezrzeszony') 
                GROUP BY vr.mp_id
            )
            UPDATE mps
            SET stats_rebellion = COALESCE(r.rebellion_count, 0)
            FROM mps m2
            LEFT JOIN rebellions r ON m2.id = r.mp_id
            WHERE mps.id = m2.id;
        """
        cur.execute(sql_rebellion)
        logger.info("Rebellion calculated.")
        
        # Cleanup
        cur.execute("DROP TABLE IF EXISTS club_consensus")
        cur.execute("DROP TABLE IF EXISTS club_winners")

        # 3. Activity Metrics
        logger.info("Calculating Activity Metrics (Speeches, Interpellations, Score)...")
        
        sql_activity = """
            WITH activity AS (
                SELECT
                    m.id as mp_id,
                    COUNT(DISTINCT s.id) as speech_count,
                    COUNT(DISTINCT ia.interpellation_id) as interpellation_count
                FROM mps m
                LEFT JOIN speeches s ON m.id = s.mp_id
                LEFT JOIN interpellation_authors ia ON m.id = ia.mp_id
                GROUP BY m.id
            )
            UPDATE mps
            SET 
                stats_speeches_count = a.speech_count,
                stats_interpellations_count = a.interpellation_count,
                stats_bills_count = 0, -- Placeholder until scraper built
                stats_activity_score = (a.speech_count * 1) + (a.interpellation_count * 2)
            FROM activity a
            WHERE mps.id = a.mp_id;
        """
        cur.execute(sql_activity)
        logger.info("Activity Metrics calculated.")

    logger.info("Stats ETL Complete.")

if __name__ == "__main__":
    calculate_stats()
