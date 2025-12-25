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
        # Present = result IN ('Za', 'Przeciw', 'Wstrzymał się')
        # Total = count(*)
        # Note: 'Nieobecny' is the only 'Absent' status? Or 'Głos nieważny'?
        # Assuming database stores 'Nieobecny' for absence.
        
        sql_attendance = """
            WITH stats AS (
                SELECT 
                    mp_id,
                    COUNT(*) as total,
                    COUNT(CASE WHEN result IN ('Za', 'Przeciw', 'Wstrzymał się') THEN 1 END) as present
                FROM vote_results
                GROUP BY mp_id
            )
            UPDATE mps
            SET stats_attendance = CASE 
                WHEN s.total > 0 THEN ROUND((s.present::numeric / s.total::numeric) * 100, 2)
                ELSE 0 
            END
            FROM stats s
            WHERE mps.id = s.mp_id;
        """
        cur.execute(sql_attendance)
        logger.info("Attendance calculated.")
        
        # 2. Rebellion (Indywidualizm)
        # Definition: Votes where MP result != Club Majority result
        logger.info("Calculating Rebellion (Simplistic)...")
        # Step A: Determine Club Result for each Vote
        # Complex query. For now, let's try a simplifed approach or just skip if too heavy.
        # But user wants Rankings.
        # Let's do it properly but optimized.
        
        # Temp table for club consensus
        cur.execute("CREATE TEMP TABLE club_consensus AS SELECT vote_id, club, result, count(*) as cnt FROM vote_results JOIN mps ON vote_results.mp_id = mps.id GROUP BY vote_id, club, result")
        
        # Create 'Winner' per vote per club
        # Using DISTINCT ON or Window Function
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
                JOIN club_winners cw ON vr.vote_id = cw.vote_id AND m.club = cw.club
                WHERE vr.result != cw.majority_result
                  AND vr.result IN ('Za', 'Przeciw', 'Wstrzymał się') -- Ignore absence as rebellion? Usually yes.
                  AND cw.majority_result IN ('Za', 'Przeciw', 'Wstrzymał się') -- Ignore if club was absent
                GROUP BY vr.mp_id
            )
            UPDATE mps
            SET stats_rebellion = r.rebellion_count
            FROM rebellions r
            WHERE mps.id = r.mp_id;
        """
        cur.execute(sql_rebellion)
        logger.info("Rebellion calculated.")
        
        # Cleanup
        cur.execute("DROP TABLE IF EXISTS club_consensus")
        cur.execute("DROP TABLE IF EXISTS club_winners")

    logger.info("Stats ETL Complete.")

if __name__ == "__main__":
    calculate_stats()
