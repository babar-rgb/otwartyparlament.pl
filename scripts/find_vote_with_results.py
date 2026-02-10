import sys
import os

# Add the current directory to sys.path to allows imports from backend
sys.path.append(os.getcwd())

from backend.core.db import db

def main():
    print("Searching for vote with results...")
    try:
        with db.get_cursor() as cur:
            # Find a vote_id that has results
            cur.execute("SELECT vote_id, COUNT(*) as c FROM vote_results GROUP BY vote_id HAVING COUNT(*) > 0 ORDER BY c DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                print(f"FOUND_VOTE_ID: {row['vote_id']} (count: {row['c']})")
            else:
                print("NO_VOTE_RESULTS_FOUND")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
