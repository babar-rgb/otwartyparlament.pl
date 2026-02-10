import logging
logging.basicConfig(level=logging.INFO)

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
    
    logging.info(f"Hallucinations found:")
    logging.info(f"- 'Klub Osobistych Inwestorów': {count_ko}")
    logging.info(f"- 'posessenionach': {count_pos}")
    
    if count_ko > 0:
        cur.execute("SELECT id, first_name, last_name FROM mps WHERE biography ILIKE '%Klub Osobistych Inwestorów%' LIMIT 5")
        rows = cur.fetchall()
        logging.info("Examples:")
        for r in rows:
            logging.info(f"- {r['first_name']} {r['last_name']} ({r['id']})")
