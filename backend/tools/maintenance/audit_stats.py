import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db

def audit_stats():
    # Szymon Hołownia usually has ID 133 (from URL in screenshot /poslowie/133)
    target_id = 133
    
    print(f"Auditing stats for MP ID {target_id} (Hołownia)...")
    
    with db.get_cursor() as cur:
        # 1. Check raw MP record
        cur.execute("SELECT * FROM mps WHERE id = %s", (target_id,))
        mp = cur.fetchone()
        
        if not mp:
            print("❌ MP not found!")
            return
            
        print("\n--- MP Record ---")
        print(f"Name: {mp['first_name']} {mp['last_name']}")
        print(f"Stats Rebellion (Column): {mp.get('stats_rebellion', 'MISSING')}")
        print(f"Stats Attendance (Column): {mp.get('stats_attendance', 'MISSING')}")
        
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
            
            print("\n--- Interpellations ---")
            print(f"Found for Hołownia (via interpellation_authors): {interp_mp}")
        except Exception as e:
            print(f"Error checking interpellations: {e}")

if __name__ == "__main__":
    audit_stats()
