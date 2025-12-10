import requests
import psycopg2
import sys

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def fetch_prints():
    print("Connecting to Sejm API...")
    url = "https://api.sejm.gov.pl/sejm/term10/prints"
    
    try:
        r = requests.get(url, timeout=15)
        print(f"Status: {r.status_code}")
        
        if r.status_code != 200:
            print(f"Error: {r.text}")
            return
            
        data = r.json()
        print(f"Got {len(data)} items from API.")
        
        if not data:
            return
            
        print("Sample Item 0:")
        print(data[0])
        
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        inserted = 0
        errors = 0
        
        for item in data:
            try:
                number = item.get('number')
                title = item.get('title')
                summary = item.get('summary', '')
                process_id = item.get('processPrint', [None])[0] 
                
                if not number:
                    continue
                    
                cur.execute("""
                    INSERT INTO sejm_prints (number, title, summary, process_id)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (number) DO UPDATE SET 
                        title = EXCLUDED.title,
                        summary = EXCLUDED.summary,
                        process_id = EXCLUDED.process_id
                """, (number, title, summary, process_id))
                inserted += 1
            except Exception as e:
                errors += 1
                if errors < 5:
                    print(f"Insert Error: {e}")
                    
        conn.commit()
        conn.close()
        print(f"Done. Inserted/Updated: {inserted}. Errors: {errors}")
        
    except Exception as e:
        print(f"Script Error: {e}")

if __name__ == "__main__":
    fetch_prints()
