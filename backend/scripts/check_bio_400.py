
import sys
import os
sys.path.append(os.getcwd())
from backend.core.db import db

with db.get_cursor() as cur:
    cur.execute("SELECT biography FROM mps WHERE id = 400")
    row = cur.fetchone()
    if row and row['biography']:
        print(f"Bio found: {row['biography']}")
    else:
        print("Bio not found/empty")
