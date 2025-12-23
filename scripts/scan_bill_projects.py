import os
import time
import requests
import psycopg2
import subprocess
import re
import tempfile
import google.generativeai as genai

# Load .env if possible
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value.strip()
except Exception:
    pass

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
model = None
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
    except Exception as e:
        print(f"⚠️ Failed to init Gemini: {e}")

# DB Config
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_prints_to_process(limit=50):
    """
    Fetches print numbers and titles from sejm_prints table.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    query = """
        SELECT sp.number, sp.title 
        FROM sejm_prints sp
        LEFT JOIN bill_insights bi ON sp.number = bi.print_number
        WHERE bi.print_number IS NULL
        LIMIT 3000
    """
    
    cur.execute(query)
    rows = cur.fetchall()
    conn.close()
    
    def parse_print_number(num_str):
        try:
            match = re.search(r'\d+', str(num_str))
            return int(match.group(0)) if match else 0
        except:
            return 0

    # Sort: High ID = Newest
    sorted_rows = sorted(rows, key=lambda x: parse_print_number(x[0]), reverse=True)
    return sorted_rows[:limit]

def summarize_text_friendly(text, doc_type):
    """
    Creates a friendly summary of the bill using the 5-point journalistic style.
    """
    if not text or not model: return ""
    
    prompt = f"""
    Jesteś doświadczonym dziennikarzem parlamentarnym, który potrafi tłumaczyć zawiłości prawne na ludzki język. 
    Twoim zadaniem jest przygotowanie przyjaznego opracowania dla dokumentu typu: {doc_type}.
    
    Oto treść dokumentu (lub jego początek):
    ---
    {text[:12000]}
    ---
    
    Przygotuj opracowanie DOKŁADNIE w poniższym formacie 5 punktów. 
    Używaj języka dziennikarskiego, przystępnego, ale profesjonalnego. Unikaj żargonu urzędniczego.
    Punkty muszą być ponumerowane 1-5 i mieć pogrubione nagłówki jak w przykładzie niżej.
    
    Wymagany format:
    1. **Co to jest**: (krótkie, zrozumiałe wyjaśnienie, co to za dokument i czego dotyczy)
    2. **Kluczowy wniosek / zmiana**: (najważniejsza rzecz, którą dokument wprowadza lub raportuje)
    3. **Czynniki bezpieczeństwa i stabilności**: (jak to wpływa na bezpieczeństwo obywateli, państwa lub stabilność systemu)
    4. **Kontekst i skala**: (jak duży to problem/zmiana, kogo dotyczy, jakie są ryzyka)
    5. **Wpływ na Ciebie**: (empatyczne podsumowanie, co to oznacza dla przeciętnego Polaka w codziennym życiu)
    
    Odpowiedz w języku polskim. Skup się na konkretach.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  ❌ AI Error: {e}")
        return ""

def classify_document(title):
    """
    Classifies the document based on title keywords.
    """
    t = title.lower()
    if "projekt ustawy" in t:
        return "projekt ustawy"
    if "sprawozdanie" in t:
        return "sprawozdanie"
    if "informacja" in t:
        return "informacja / raport"
    if "uchwała" in t:
        return "projekt uchwały"
    if "budżet" in t:
        return "ustawa budżetowa"
    return "dokument / inny"

def download_pdf(print_number):
    meta_url = f"{SEJM_API_URL}/prints/{print_number}"
    print(f"Fetching metadata for Print {print_number}...")
    try:
        resp = requests.get(meta_url, timeout=5)
        if resp.status_code != 200:
            return None, None
        data = resp.json()
        attachments = data.get("attachments", [])
        if not attachments:
            return None, None
        filename = attachments[0]
        pdf_url = f"{SEJM_API_URL}/prints/{print_number}/{filename}"
        print(f"  ⬇️ Downloading {filename}...")
        pdf_resp = requests.get(pdf_url, stream=True, timeout=10)
        if pdf_resp.status_code == 200:
            tmp_path = os.path.join(tempfile.gettempdir(), f"sejm_print_{print_number}.pdf")
            with open(tmp_path, 'wb') as f:
                for chunk in pdf_resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            return tmp_path, pdf_url
        return None, None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None, None

def extract_text_from_pdf(pdf_path):
    try:
        result = subprocess.run(["pdftotext", "-layout", pdf_path, "-"], capture_output=True, text=True)
        return result.stdout if result.returncode == 0 else None
    except Exception as e:
        print(f"  ❌ pdftotext error: {e}")
        return None

def get_bill_full_text(full_text):
    if not full_text: return None
    return re.sub(r'\s+', ' ', full_text).strip()

def save_insight(print_number, justification, summary, pdf_url, doc_type):
    conn = get_db_connection()
    cur = conn.cursor()
    query = """
    INSERT INTO bill_insights (print_number, justification_text, ai_summary, pdf_url, document_type, last_updated)
    VALUES (%s, %s, %s, %s, %s, NOW())
    ON CONFLICT (print_number) DO UPDATE SET
        justification_text = EXCLUDED.justification_text,
        ai_summary = EXCLUDED.ai_summary,
        pdf_url = EXCLUDED.pdf_url,
        document_type = EXCLUDED.document_type,
        last_updated = NOW();
    """
    cur.execute(query, (print_number, justification, summary, pdf_url, doc_type))
    conn.commit()
    conn.close()
    print(f"  💾 Saved to DB as {doc_type}.")

def main():
    print("🚀 Starting Automated Friendly Project Scanner (Gemini Scale-up)...")
    
    if not GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY missing! Running in placeholder mode.")
    
    # Get prints to process
    prints_to_process = get_prints_to_process(limit=50) 
    print(f"📊 Found {len(prints_to_process)} prints to process.")
    
    count = 0
    for p_nr, p_title in prints_to_process:
        print(f"\n📄 Processing Print {p_nr}: {p_title[:100]}...")
        doc_type = classify_document(p_title)
        
        pdf_path, pdf_url = download_pdf(p_nr)
        if not pdf_path: continue
            
        print("  📝 Extracting full text...")
        full_text_raw = extract_text_from_pdf(pdf_path)
        if pdf_path and os.path.exists(pdf_path):
            os.remove(pdf_path)
        
        if not full_text_raw: continue
            
        bill_text = get_bill_full_text(full_text_raw)
        if bill_text:
            print(f"  ✅ Extracted Full Text ({len(bill_text)} chars)")
            print(f"  🤖 Generating 5-point summary for {doc_type}...")
            summary = summarize_text_friendly(bill_text, doc_type)
            if not summary:
                summary = f"[ Friendly Summary placeholder for {doc_type} ]"
                
            save_insight(p_nr, bill_text, summary, pdf_url, doc_type)
            count += 1
            
        time.sleep(1) # Rate limiting for Sejm API and Gemini

    print(f"\n✅ Finished processing {count} prints.")

if __name__ == "__main__":
    main()
