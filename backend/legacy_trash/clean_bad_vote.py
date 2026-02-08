import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db

def clean_vote():
    # Vote ID 480069 (10/48/69)
    vote_id = 480069
    print(f"Cleaning results for vote {vote_id}...")
    
    with db.get_cursor(commit=True) as cur:
        cur.execute("DELETE FROM vote_results WHERE vote_id = %s", (vote_id,))
        print(f"Deleted rows.")

if __name__ == "__main__":
    clean_vote()
