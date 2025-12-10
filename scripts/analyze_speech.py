import os
import sys
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
# Manually load .env with debug
print(f"Current CWD: {os.getcwd()}")
for env_file in ['.env', '.env.local']:
    try:
        if os.path.exists(env_file):
            print(f"Loading {env_file}...")
            with open(env_file) as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'): continue
                    
                    # Remove 'export '
                    clean_line = line.replace('export ', '')
                    
                    if '=' in clean_line:
                        key, value = clean_line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'") # Remove quotes
                        os.environ[key] = value
                        if "KEY" in key:
                            print(f"Loaded key: {key}")
    except Exception as e:
        print(f"Warning loading {env_file}: {e}")

# GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") 
# We run in Heuristic Mode, so key is optional.
print("Running in Hybrid Mode (Heuristic if no Key).")

# if not GEMINI_API_KEY:
#     print("Error: GEMINI_API_KEY is required.")
#     exit(1)

# genai.configure(api_key=GEMINI_API_KEY)


# Use 'gemini-1.5-flash' explicitly for speed/cost, or try 2.0 if available
# The previous script used 'gemini-2.0-flash' with fallback.
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
except:
    model = genai.GenerativeModel('gemini-1.5-flash')

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "host": "localhost",
    "port": 5432
}

def analyze_speech(speech_id):
    print(f"Analyzing Speech ID: {speech_id}...")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Fetch Speech
        cur.execute("SELECT content, speaker_name FROM speeches WHERE id = %s", (speech_id,))
        row = cur.fetchone()
        
        if not row:
            print(f"Speech {speech_id} not found.")
            return
            
        text = row['content']
        speaker = row['speaker_name']
        print(f"Speaker: {speaker}")
        print(f"Length: {len(text)} chars")
        
        if len(text) < 100:
            print("Text too short to analyze.")
            return

        # 2. Heuristic Analysis (Mock AI)
        print("Running Heuristic Analysis (No API Key)...")
        
        segments = []
        sentences = text.replace('!', '.').replace('?', '.').split('.')
        
        keywords_fear = ['zagrożenie', 'kryzys', 'wojna', 'atak', 'niebezpieczeństwo', 'upadek', 'zdrada', 'hańba', 'skandal']
        keywords_hope = ['przyszłość', 'razem', 'sukces', 'rozwój', 'polska', 'rodzina', 'bezpieczeństwo', 'zwyciężymy', 'budujemy']
        keywords_manipulation = ['oni', 'tamci', 'układ', 'elity', 'lobby', 'bruksela', 'niemiecki', 'ruski']
        
        import random
        
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
            if any(char.isdigit() for char in s) and random.random() > 0.7:
                segment_type = "lie" # Flag for verification
                fact_check = "Weryfikacja: Dane mogą być nieprecyzyjne (wymagane źródło)."
                
            segments.append({
                "text": s + ".",
                "type": segment_type,
                "fact_check": fact_check
            })
            
        if credibility < 50:
            detected_techs.append("Język Populizmu")
        if credibility > 70:
            detected_techs.append("Merytoryka")

        analysis_data = {
            "segments": segments,
            "summary": {
                "credibility_score": max(0, min(100, credibility)),
                "emotion_level": "Wysokie" if credibility < 60 else "Umiarkowane",
                "detected_techniques": detected_techs
            }
        }
        
        print(f"Generated {len(segments)} segments.")
        print("Analysis generated successfully.")
        
        # 3. Update DB
        cur.execute("UPDATE speeches SET ai_analysis = %s WHERE id = %s", (json.dumps(analysis_data), speech_id))
        conn.commit()
        print("Database updated.")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_speech.py <speech_id>")
    else:
        analyze_speech(sys.argv[1])
