
import sys
import os
sys.path.append(os.getcwd())
from backend.core.db import db

with db.get_cursor() as cur:
    cur.execute("SELECT id, first_name, last_name, biography FROM mps WHERE id = 334")
    row = cur.fetchone()
    if row:
        print(f"MP: {row['first_name']} {row['last_name']}")
        print(f"Bio length: {len(row['biography']) if row['biography'] else 0}")
    else:
        print("MP not found")
