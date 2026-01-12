import sys
import os
import json

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

try:
    from backend.core.db import db
    from backend.services.ollama import ollama_service
    from backend.etl.analysis.generate_mp_bios import BiographyGenerator
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from core.db import db
    from services.ollama import ollama_service
    from etl.analysis.generate_mp_bios import BiographyGenerator # This import might fail if circular or path oddity

def verify():
    print("🔍 Searching for Donald Tusk...")
    with db.get_cursor(commit=True) as cur:
        cur.execute("SELECT * FROM mps WHERE first_name = 'Donald' AND last_name = 'Tusk' LIMIT 1")
        mp = cur.fetchone()
        
        if not mp:
            print("⚠️ Donald Tusk not found. Fetching any MP...")
            cur.execute("SELECT * FROM mps LIMIT 1")
            mp = cur.fetchone()
            
        if not mp:
            print("❌ No MPs found in database.")
            return

        print(f"👤 Generating Bio for: {mp['first_name']} {mp['last_name']} (ID: {mp['id']})")
        
        generator = BiographyGenerator(term=mp['term'])
        stats = generator.get_mp_stats(mp['id'])
        print(f"📊 Stats context: {stats}")
        
        bio = ollama_service.generate_mp_bio(mp, stats)
        
        if bio:
            print("\n✅ Biography Generated Successfully:")
            print("="*60)
            print(bio)
            print("="*60)
            
            # Save to DB to verify full loop
            cur.execute("UPDATE mps SET biography = %s WHERE id = %s", (bio, mp['id']))
            print("💾 Saved to Database.")
        else:
            print("❌ Failed to generate biography.")

if __name__ == "__main__":
    verify()
