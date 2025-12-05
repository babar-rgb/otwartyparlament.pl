import os
import google.generativeai as genai
from supabase import create_client, Client
import json
import time

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()
except Exception:
    pass

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY is required.")
    exit(1)

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials required.")
    exit(1)

# Initialize Clients
genai.configure(api_key=GEMINI_API_KEY)
try:
    model = genai.GenerativeModel('gemini-2.0-flash')
except:
    model = genai.GenerativeModel('gemini-1.5-flash')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_analysis():
    print("Starting AI Analysis Generation (Gemini - Health Filter)...")

    # 1. Fetch votes that don't have analysis yet
    
    # Get IDs of already analyzed votes
    existing_ids_response = supabase.table('vote_analyses').select('vote_id').execute()
    existing_ids = {item['vote_id'] for item in existing_ids_response.data}
    
    # Fetch recent votes
    votes_response = supabase.table('votes')\
        .select('id, title_clean, title_raw, category')\
        .order('date', desc=True)\
        .limit(6000)\
        .execute()
    
    # Filter for Health related votes
    keywords = ['zdrow', 'szpital', 'medy', 'lekar', 'pielęgniar', 'pacjen', 'leków', 'refundac']
    
    votes_to_process = []
    for v in votes_response.data:
        if v['id'] in existing_ids:
            continue
            
        text_content = (v.get('title_clean') or '') + " " + (v.get('title_raw') or '')
        text_content = text_content.lower()
        
        if any(k in text_content for k in keywords):
            votes_to_process.append(v)
    
    print(f"Found {len(votes_to_process)} new HEALTH related votes to analyze.")
    
    for vote in votes_to_process:
        try:
            title = vote.get('title_clean') or vote.get('title_raw')
            print(f"Analyzing: {title}...")
            
            prompt = f"""
            Jesteś ekspertem od polskiego parlamentaryzmu i systemu ochrony zdrowia. 
            Przeanalizuj to głosowanie i przygotuj krótkie, obiektywne podsumowanie dla zwykłego pacjenta/obywatela.
            
            Tytuł: {title}
            Kategoria: {vote.get('category')}
            
            Wymagany format JSON:
            {{
                "summary": "2-3 zdania prostym językiem o co chodzi w tej zmianie w ochronie zdrowia. Unikaj urzędniczego języka.",
                "pros": ["Zaleta/Argument ZA nr 1", "Zaleta/Argument ZA nr 2"],
                "cons": ["Wada/Ryzyko/Argument PRZECIW nr 1", "Wada/Ryzyko/Argument PRZECIW nr 2"]
            }}
            
            Odpowiedz TYLKO czystym JSONem.
            """
            
            response = model.generate_content(prompt)
            text_response = response.text.strip()
            
            # Clean up markdown code blocks if present
            if text_response.startswith("```json"):
                text_response = text_response[7:-3]
            elif text_response.startswith("```"):
                text_response = text_response[3:-3]
                
            analysis_json = json.loads(text_response)
            
            # Save to DB
            data = {
                "vote_id": vote['id'],
                "summary": analysis_json.get('summary'),
                "pros": analysis_json.get('pros', []),
                "cons": analysis_json.get('cons', [])
            }
            
            supabase.table('vote_analyses').insert(data).execute()
            print("Saved analysis.")
            
            time.sleep(1) # Rate limiting
            
        except Exception as e:
            print(f"Error analyzing vote {vote['id']}: {e}")

if __name__ == "__main__":
    generate_analysis()
