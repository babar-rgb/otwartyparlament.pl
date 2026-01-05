import os
import time
import google.generativeai as genai
from supabase import create_client, Client

# Configuration
# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Initialize Clients
genai.configure(api_key=GEMINI_API_KEY)
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
except:
    model = genai.GenerativeModel('gemini-1.5-flash')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TARGET_VOTE_ID = 260048

def force_analyze():
    print(f"Force Analyzing Vote ID: {TARGET_VOTE_ID}...")
    
    # Fetch the specific vote
    response = supabase.table('votes')\
        .select('*')\
        .eq('id', TARGET_VOTE_ID)\
        .execute()
        
    if not response.data:
        print("Vote not found!")
        return

    vote = response.data[0]
    print(f"Vote Title: {vote['title_clean']}")
    
    # Construct Prompt
    # Removed 'description' as it doesn't exist
    text_content = (vote.get('title_clean') or '') + "\n" + (vote.get('title_raw') or '')
    
    prompt = f"""
    Proszę o analizę głosowania sejmowego na temat:
    "{text_content}"

    Przygotuj odpowiedź w formacie JSON z polami:
    1. "summary": Krótkie podsumowanie o czym jest głosowanie (2-3 zdania) - prostym językiem dla wyborcy.
    2. "pros": Tablica (list) 2-3 punktów z argumentami ZA przyjęciem.
    3. "cons": Tablica (list) 2-3 punktów z argumentami PRZECIW lub zagrożeniami.

    Odpowiedź musi być czystym JSON.
    """
    
    try:
        print("Generating content with Gemini...")
        result = model.generate_content(prompt)
        response_text = result.text
        
        # Parse JSON
        import json
        
        # Clean markdown
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        analysis_json = json.loads(cleaned_text)
        
        data_to_insert = {
            "vote_id": vote['id'],
            "summary": analysis_json.get("summary"),
            "pros": analysis_json.get("pros"),
            "cons": analysis_json.get("cons")
        }
        
        # Insert
        print("Saving to DB...")
        supabase.table('vote_analyses').upsert(data_to_insert).execute()
        print("Success!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    force_analyze()
