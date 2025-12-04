import os
import time
import json
import requests
import tempfile
from pdf2image import convert_from_path
import google.generativeai as genai
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_KEY or not GEMINI_API_KEY:
    print(f"Error: Credentials required.")
    print(f"SUPABASE_URL: {'Found' if SUPABASE_URL else 'Missing'}")
    print(f"SUPABASE_KEY: {'Found' if SUPABASE_KEY else 'Missing'}")
    print(f"GEMINI_API_KEY: {'Found' if GEMINI_API_KEY else 'Missing'}")
    print(f"Current CWD: {os.getcwd()}")
    print(f"Files in CWD: {os.listdir('.')}")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_API_KEY)

# Use Gemini 2.0 Flash for multimodal capabilities
MODEL_NAME = 'gemini-2.0-flash' 

def digitize_declarations():
    print("Starting Asset Declarations Digitization...")
    
    # 1. Fetch MPs with declarations
    response = supabase.table('mps').select('id, name, declarations').order('id').execute()
    mps = response.data
    
    print(f"Found {len(mps)} MPs to process.")
    
    for i, mp in enumerate(mps):
        if not mp.get('declarations'):
            continue

        print(f"[{i+1}/{len(mps)}] Checking {mp['name']} (ID: {mp['id']})...")
        declarations = mp['declarations']
    
        for decl in declarations:
            pdf_url = decl['url']
            label = decl['label']
            
            # Check if already processed
            existing = supabase.table('asset_declarations').select('id').eq('mp_id', mp['id']).eq('pdf_url', pdf_url).execute()
            if existing.data:
                # print(f"  Skipping {label} (already processed).")
                continue
                
            print(f"  Processing {label} ({pdf_url})...")
            
            try:
                # Download PDF
                headers = {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
                r = requests.get(pdf_url, headers=headers)
                
                if r.status_code != 200:
                    print(f"  Error downloading: {r.status_code}")
                    continue

                with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp_pdf:
                    tmp_pdf.write(r.content)
                    tmp_pdf_path = tmp_pdf.name
                
                # Convert to images (first 3 pages usually contain the summary)
                # print("  Converting PDF to images...")
                images = convert_from_path(tmp_pdf_path, first_page=1, last_page=3)
                
                # Prepare prompt
                prompt = """
                Analyze these pages of a Polish MP's asset declaration (Oświadczenie Majątkowe).
                Extract the following information into a JSON object:
                1. "savings": Total savings in PLN (approximate if multiple currencies).
                2. "real_estate": List of properties (e.g., "Dom 150m2", "Mieszkanie 50m2").
                3. "income": Total annual income (sum of all sources).
                4. "car": List of cars/vehicles (brand, model, year).
                5. "summary": A 1-sentence summary of their wealth status (e.g., "Posiada znaczne oszczędności i dwa domy").
                
                Return ONLY raw JSON.
                """
                
                # Call Gemini
                # print("  Calling Gemini...")
                model = genai.GenerativeModel(MODEL_NAME)
                response = model.generate_content([prompt, *images])
                
                # Parse JSON
                text = response.text.replace('```json', '').replace('```', '').strip()
                data = json.loads(text)
                
                # print("  Extracted Data:", json.dumps(data, indent=2, ensure_ascii=False))
                
                # Save to DB
                supabase.table('asset_declarations').insert({
                    'mp_id': mp['id'],
                    'pdf_url': pdf_url,
                    'year': label,
                    'parsed_content': data,
                    'summary': data.get('summary', '')
                }).execute()
                
                print(f"  Saved {label} to database.")
                
                # Cleanup
                os.remove(tmp_pdf_path)
                
                # Rate limiting / Politeness
                time.sleep(1)
                
            except Exception as e:
                print(f"  Error processing {label}: {e}")
                if 'tmp_pdf_path' in locals() and os.path.exists(tmp_pdf_path):
                    os.remove(tmp_pdf_path)

if __name__ == "__main__":
    digitize_declarations()
