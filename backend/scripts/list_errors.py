
import sys
import os
sys.path.append(os.getcwd())
from backend.core.db import db

with db.get_cursor() as cur:
    cur.execute("SELECT id, first_name, last_name FROM mps WHERE biography ILIKE '%posessenionach%'")
    rows = cur.fetchall()
    print("MPs to fix:")
    for r in rows:
        print(f"- {r['first_name']} {r['last_name']} ({r['id']})")
