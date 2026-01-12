
import sys
import os
sys.path.append(os.getcwd())
from backend.core.db import db

with db.get_cursor() as cur:
    # Check for specific hallucination
    cur.execute("SELECT count(*) as c FROM mps WHERE biography ILIKE '%Klub Osobistych Inwestorów%'")
    res = cur.fetchone()
    count_ko = res['c'] if res else 0
    
    cur.execute("SELECT count(*) as c FROM mps WHERE biography ILIKE '%posessenionach%'")
    res = cur.fetchone()
    count_pos = res['c'] if res else 0
    
    print(f"Hallucinations found:")
    print(f"- 'Klub Osobistych Inwestorów': {count_ko}")
    print(f"- 'posessenionach': {count_pos}")
    
    if count_ko > 0:
        cur.execute("SELECT id, first_name, last_name FROM mps WHERE biography ILIKE '%Klub Osobistych Inwestorów%' LIMIT 5")
        rows = cur.fetchall()
        print("Examples:")
        for r in rows:
            print(f"- {r['first_name']} {r['last_name']} ({r['id']})")
