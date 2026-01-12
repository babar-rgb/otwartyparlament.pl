import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.db import db

def inspect_schema():
    print("--- MPS Table ---")
    with db.get_cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'mps'")
        print([row['column_name'] for row in cur.fetchall()])
        
    print("\n--- INTERPELLATIONS Table ---")
    with db.get_cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'interpellations'")
        print([row['column_name'] for row in cur.fetchall()])
        
    print("\n--- Any LINK Table? (like authors) ---")
    with db.get_cursor() as cur:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%author%'")
        print([row['table_name'] for row in cur.fetchall()])

if __name__ == "__main__":
    inspect_schema()
