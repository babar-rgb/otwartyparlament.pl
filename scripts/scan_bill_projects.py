import os
import time
import requests
import psycopg2
import subprocess
import re
import tempfile

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
    print("🚀 Starting Friendly Project Scanner with Classification...")
    
    # Get 2 newest prints (any type)
    newest_rows = get_prints_to_process(limit=2)
    print(f"📊 Targeting 2 newest prints: {[r[0] for r in newest_rows]}")
    
    count = 0
    for p_nr, p_title in newest_rows:
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
            # Friendly summary will be empty for now, I'll fill it manually for the first 2
            summary = f"[ Friendly Summary placeholder for {doc_type} ]"
            save_insight(p_nr, bill_text, summary, pdf_url, doc_type)
            count += 1
            
        time.sleep(1)

    print(f"\n✅ Finished processing {count} prints.")

if __name__ == "__main__":
    main()
