import psycopg2
import re
from collections import Counter

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

STOP_WORDS = set(["ustawa", "dnia", "zmieniająca", "sprawie", "oraz", "przez", "tego", "który", "która", "jest", "rządowy", "projekt", "poselski", "komisyjny", "zmianie", "ustawy"])

def generate_mermaid(title):
    # simple heuristic
    words = re.findall(r'\w+', title.lower())
    words = [w for w in words if len(w) > 4 and w not in STOP_WORDS]
    
    common = Counter(words).most_common(6)
    
    if not common:
        return None
        
    mm = "mindmap\n"
    # Root
    short_title = title[:20] + "..." if len(title) > 20 else title
    mm += f"  root(({short_title}))\n"
    
    for word, count in common:
        mm += f"    {word}\n"
        
    return mm

def worker():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("Fetching Votes without Mind Map...")
    # Get votes that need processing
    # Assuming vote_analyses has 1:1 with votes. If not exist, insert.
    
    cur.execute("""
        SELECT v.id, v.title_clean, va.mind_map
        FROM votes v
        LEFT JOIN vote_analyses va ON v.id = va.vote_id
        WHERE va.mind_map IS NULL
    """)
    
    rows = cur.fetchall()
    print(f"Found {len(rows)} votes to process.")
    
    count = 0
    for vid, title, mm_exist in rows:
        mm = generate_mermaid(title)
        if not mm: continue
        
        # Upsert
        cur.execute("""
            INSERT INTO vote_analyses (vote_id, mind_map, created_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (vote_id) DO UPDATE SET mind_map = EXCLUDED.mind_map
        """, (vid, mm))
        
        count += 1
        if count % 100 == 0:
            print(f"Processed {count}...")
            conn.commit()
            
    conn.commit()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    worker()
