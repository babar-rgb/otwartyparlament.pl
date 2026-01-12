
import sys
import os
import time

# Add parent directory to path
sys.path.append(os.getcwd())

from backend.core.db import db
from backend.services.ollama import ollama_service
from backend.etl.analysis.generate_mp_bios import BiographyGenerator

ids_to_fix = [400]

if __name__ == "__main__":
    generator = BiographyGenerator()
    
    for mp_id in ids_to_fix:
        print(f"Regenerating bio for MP {mp_id}...")
        
        with db.get_cursor() as cur:
            cur.execute("SELECT id, first_name, last_name, club, profession, birth_date, birth_location, education_level, education_history FROM mps WHERE id = %s", (mp_id,))
            mp = cur.fetchone()
            
        if not mp:
            print(f"MP {mp_id} not found, skipping.")
            continue
            
        stats_summary = generator.get_mp_stats(mp_id)
        
        try:
            bio = ollama_service.generate_mp_bio(mp, stats_summary)
            if bio:
                with db.get_cursor(commit=True) as cur:
                    cur.execute("UPDATE mps SET biography = %s WHERE id = %s", (bio, mp_id))
                print(f"SUCCESS: Bio saved for MP {mp_id}.")
            else:
                print(f"FAILURE: Bio generation returned empty for MP {mp_id}.")
        except Exception as e:
            print(f"ERROR processing MP {mp_id}: {e}")
