import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db

def debug_vote():
    # Target: Term 10, Sitting 48, Vote 69
    term = 10
    sitting = 48
    number = 69
    
    print(f"Checking Vote: Term {term}, Sitting {sitting}, No {number}")
    
    with db.get_cursor() as cur:
        # 1. Get Vote ID
        cur.execute("SELECT id, title_clean FROM votes WHERE term=%s AND sitting=%s AND voting_number=%s", (term, sitting, number))
        vote = cur.fetchone()
        
        if not vote:
            print("❌ Vote NOT FOUND in 'votes' table.")
            return

        print(f"✅ Found Vote ID: {vote['id']}")
        print(f"   Title: {vote['title_clean']}")
        
        # 2. Check Results
        cur.execute("SELECT count(*) as cnt FROM vote_results WHERE vote_id = %s", (vote['id'],))
        res = cur.fetchone()
        count = res['cnt']
        
        print(f"📊 Results count in 'vote_results': {count}")
        
        if count == 0:
            print("🚨 CONFIRMED: No results for this vote.")
        else:
            print("🤔 Weird. Results exist in DB.")
            cur.execute("SELECT * FROM vote_results WHERE vote_id = %s LIMIT 5", (vote['id'],))
        # 3. Aggregate Results
        cur.execute("SELECT result, count(*) FROM vote_results WHERE vote_id = %s GROUP BY result", (vote['id'],))
        dist = cur.fetchall()
        print("📊 Distribution:", dist)

if __name__ == "__main__":
    debug_vote()
