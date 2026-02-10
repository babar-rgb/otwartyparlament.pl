import logging
logging.basicConfig(level=logging.INFO)
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db

def audit_stats():
    # Szymon Hołownia usually has ID 133 (from URL in screenshot /poslowie/133)
    target_id = 133
    
    logging.info(f"Auditing stats for MP ID {target_id} (Hołownia)...")
    
    with db.get_cursor() as cur:
        # 1. Check raw MP record
        cur.execute("SELECT * FROM mps WHERE id = %s", (target_id,))
        mp = cur.fetchone()
        
        if not mp:
            logging.info("❌ MP not found!")
            return
            
        logging.info("\n--- MP Record ---")
        logging.info(f"Name: {mp['first_name']} {mp['last_name']}")
        logging.info(f"Stats Rebellion (Column): {mp.get('stats_rebellion', 'MISSING')}")
        logging.info(f"Stats Attendance (Column): {mp.get('stats_attendance', 'MISSING')}")
        
        # 2. Check Interpellations (via Link Table)
        try:
            # Check link table
            cur.execute("""
                SELECT count(*) as cnt 
                FROM interpellation_authors ia
                JOIN interpellations i ON ia.interpellation_id = i.id
                WHERE ia.mp_id = %s
            """, (target_id,))
            interp_mp = cur.fetchone()['cnt']
            
            logging.info("\n--- Interpellations ---")
            logging.info(f"Found for Hołownia (via interpellation_authors): {interp_mp}")
        except Exception as e:
            logging.info(f"Error checking interpellations: {e}")

if __name__ == "__main__":
    audit_stats()
