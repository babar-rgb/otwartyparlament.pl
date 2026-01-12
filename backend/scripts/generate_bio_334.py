
import sys
import os
import time

# Add parent directory to path
sys.path.append(os.getcwd())

from backend.core.db import db
from backend.services.ollama import ollama_service
from backend.etl.analysis.generate_mp_bios import BiographyGenerator

if __name__ == "__main__":
    mp_id = 334
    print(f"Generating bio for MP {mp_id} (Krystyna Sibińska)...")
    
    with db.get_cursor() as cur:
        cur.execute("SELECT id, first_name, last_name, club, profession, birth_date, birth_location, education_level, education_history FROM mps WHERE id = %s", (mp_id,))
        mp = cur.fetchone()
        
    if not mp:
        print("MP not found")
        sys.exit(1)
        
    generator = BiographyGenerator()
    stats_summary = generator.get_mp_stats(mp_id)
    
    # Increase timeout resilience logic if possible (simulated here by just calling it)
    # The service itself might have timeout, but we hope single run is cleaner
    try:
        bio = ollama_service.generate_mp_bio(mp, stats_summary)
        if bio:
            with db.get_cursor(commit=True) as cur:
                cur.execute("UPDATE mps SET biography = %s WHERE id = %s", (bio, mp_id))
            print("SUCCESS: Bio saved.")
            print(bio)
        else:
            print("FAILURE: Bio generation returned empty.")
    except Exception as e:
        print(f"ERROR: {e}")
