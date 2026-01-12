
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

def inspect():
    with db.get_cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'votes';")
        cols = [row['column_name'] for row in cur.fetchall()]
        print(f"Votes Columns: {cols}")

if __name__ == "__main__":
    inspect()
