import time
import subprocess
import requests
import psycopg2
import sys

# DATABASE
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] [CLEANER] {msg}")

def run_subprocess(command, name):
    log(f"Starting Module: {name}...")
    try:
        if "pip" in command:
            subprocess.run(command, shell=True, check=True)
        else:
            # Use venv python
            subprocess.run(["./venv/bin/python3"] + command.split(), check=True)
        log(f"✅ Module {name} completed successfully.")
    except Exception as e:
        log(f"❌ Module {name} failed: {e}")

def fetch_sejm_prints():
    log("Starting Sejm Prints Fetcher...")
    try:
        url = "https://api.sejm.gov.pl/sejm/term10/prints"
        r = requests.get(url, timeout=10)
        data = r.json()
        
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        count = 0
        for item in data:
            number = item.get('number')
            title = item.get('title')
            summary = item.get('summary', '')
            process_id = item.get('processPrint', [None])[0] # Taking first process ID
            
            if not number: continue
            
            cur.execute("""
                INSERT INTO sejm_prints (number, title, summary, process_id)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (number) DO NOTHING
            """, (number, title, summary, process_id))
            count += 1
            
        conn.commit()
        conn.close()
        log(f"✅ Fetched/Checked {count} prints.")
        
    except Exception as e:
        log(f"❌ Sejm Prints failed: {e}")

def main():
    print("""
    =========================================
      🌑  NIGHTLY CLEANER - OTWARTY PARLAMENT
    =========================================
    """)
    
    # 1. Enrich Euro Votes (Translation + Context)
    # Assumes enrich_votes.py handles the scraping/translation
    run_subprocess("scripts/enrich_votes.py", "Euro Enrichment")
    
    # 2. Generate Mind Maps for Sejm
    run_subprocess("scripts/nightly_mindmaps.py", "Sejm Mind Maps")
    
    # 3. Fetch Sejm Prints (New Data)
    fetch_sejm_prints()
    
    log("🎉 All Nightly Tasks Completed. Sleeping...")

if __name__ == "__main__":
    main()
