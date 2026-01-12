
import sys
import os
sys.path.append(os.getcwd())
from backend.core.db import db

with db.get_cursor() as cur:
    cur.execute("SELECT id, first_name, last_name, biography FROM mps WHERE id = 495")
    row = cur.fetchone()
    if row:
        print(f"MP: {row['first_name']} {row['last_name']}")
        print(f"Bio length: {len(row['biography']) if row['biography'] else 0}")
        print(f"Bio snippet: {row['biography'][:50] if row['biography'] else 'None'}")
    else:
        print("MP not found")
