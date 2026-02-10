from backend.core.db import db

with db.get_cursor() as cur:
    cur.execute("SELECT process_id, number, title, description FROM bills WHERE number = '24'")
    rows = cur.fetchall()
    for r in rows:
        print(r)
