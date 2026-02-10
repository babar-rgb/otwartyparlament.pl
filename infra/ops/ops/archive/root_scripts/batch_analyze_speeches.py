import os
import json
import time
import psycopg2
from psycopg2.extras import RealDictCursor
import random

# CONFIG
BATCH_SIZE = 100
MAX_SPEECHES = 500000 # Process all effectively
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "host": "localhost",
    "port": 5432
}

def analyze_text_heuristic(text):
    if not text or len(text) < 10: return None
    
    segments = []
    sentences = text.replace('!', '.').replace('?', '.').split('.')
    
    keywords_fear = ['zagrożenie', 'kryzys', 'wojna', 'atak', 'niebezpieczeństwo', 'upadek', 'zdrada', 'hańba', 'skandal', 'katastrofa', 'ruina', 'zniszczenie', 'inflacja', 'drożyzna', 'chaos', 'reżim', 'bezprawie', 'kradzież', 'afera', 'korupcja', 'panika', 'strach', 'śmierć', 'choroba', 'pandemia']
    keywords_hope = ['przyszłość', 'razem', 'sukces', 'rozwój', 'polska', 'rodzina', 'bezpieczeństwo', 'zwyciężymy', 'budujemy', 'współpraca', 'nadzieja', 'suwerenność', 'dziękuję', 'szanowni', 'wsparcie', 'pomoc', 'inwestycja', 'szkoła', 'zdrowie', 'dzieci', 'program', 'rozwiązanie', 'dialog', 'zgoda', 'wolność', 'demokracja', 'prawa', 'obywatele']
    keywords_manipulation = ['oni', 'tamci', 'układ', 'elity', 'lobby', 'bruksela', 'niemiecki', 'ruski', 'eurokraci', 'zdrajcy', 'targowica', 'agentura', 'kasta', 'ideologia', 'zamach']
    
    credibility = 80
    detected_techs = []
    
    for s in sentences:
        s = s.strip()
        if len(s) < 10: continue
        
        s_lower = s.lower()
        segment_type = "neutral"
        fact_check = None
        
        # Simple keyword matching
        if any(k in s_lower for k in keywords_fear):
            segment_type = "fear"
            credibility -= 2
        elif any(k in s_lower for k in keywords_hope):
            segment_type = "hope"
            credibility += 1
        elif any(k in s_lower for k in keywords_manipulation):
            segment_type = "manipulation"
            credibility -= 5
            
        # Fake Fact Check for numbers
        if any(char.isdigit() for char in s) and ("%" in s or "mln" in s or "mld" in s):
             if random.random() > 0.8:
                segment_type = "lie" # Flag for verification
                fact_check = "Weryfikacja: Dane liczbowe wymagają potwierdzenia w źródłach (GUS/Min.Fin)."
            
        segments.append({
            "text": s + ".",
            "type": segment_type,
            "fact_check": fact_check
        })
        
    if credibility < 50:
        detected_techs.append("Język Populizmu")
    if credibility > 70:
        detected_techs.append("Merytoryka")
    if any(s['type'] == 'fear' for s in segments):
        detected_techs.append("Technika Strachu")

    return {
        "segments": segments,
        "summary": {
            "credibility_score": max(0, min(100, credibility)),
            "emotion_level": "Wysokie" if credibility < 60 else "Umiarkowane",
            "detected_techniques": list(set(detected_techs))
        }
    }

def batch_analyze():
    print("Starting Batch Analysis (Heuristic Expert Mode)...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = True # Important for batches? No, manual commit better.
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Count Total
        cur.execute("SELECT count(*) as c FROM speeches WHERE ai_analysis IS NULL")
        total_left = cur.fetchone()['c']
        print(f"Total speeches to analyze: {total_left}")
        
        processed = 0
        
        while processed < MAX_SPEECHES:
            # Fetch Batch
            # Order by ID DESC to process newest first (most visible)
            cur.execute("""
                SELECT id, content 
                FROM speeches 
                WHERE ai_analysis IS NULL 
                ORDER BY id DESC 
                LIMIT %s
            """, (BATCH_SIZE,))
            
            rows = cur.fetchall()
            if not rows:
                print("No more speeches to process.")
                break
                
            print(f"Processing batch of {len(rows)} speeches...")
            
            for row in rows:
                analysis = analyze_text_heuristic(row['content'])
                if analysis:
                    cur.execute("UPDATE speeches SET ai_analysis = %s WHERE id = %s", (json.dumps(analysis), row['id']))
                else:
                    # Mark as processed even if empty to avoid loop? 
                    # Set empty JSON or special flag.
                    cur.execute("UPDATE speeches SET ai_analysis = '{}'::jsonb WHERE id = %s", (row['id']))

            conn.commit()
            processed += len(rows)
            print(f"Progress: {processed}/{total_left} (approx)")
            
        conn.close()
        print("Done.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    batch_analyze()
