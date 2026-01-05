import os
import requests
import subprocess
import tempfile
import json
import time

SEJM_API_URL = "https://api.sejm.gov.pl/sejm/term10"

def download_pdf(print_number):
    meta_url = f"{SEJM_API_URL}/prints/{print_number}"
    try:
        resp = requests.get(meta_url, timeout=5)
        if resp.status_code != 200:
            return None
        data = resp.json()
        attachments = data.get("attachments", [])
        if not attachments:
            return None
        filename = attachments[0]
        pdf_url = f"{SEJM_API_URL}/prints/{print_number}/{filename}"
        pdf_resp = requests.get(pdf_url, stream=True, timeout=10)
        if pdf_resp.status_code == 200:
            tmp_path = os.path.join(tempfile.gettempdir(), f"sejm_print_ext_{print_number}.pdf")
            with open(tmp_path, 'wb') as f:
                for chunk in pdf_resp.iter_content(chunk_size=8192):
                    f.write(chunk)
            return tmp_path
        return None
    except Exception as e:
        print(f"Error downloading {print_number}: {e}")
        return None

def extract_text_from_pdf(pdf_path):
    try:
        result = subprocess.run(["pdftotext", "-layout", pdf_path, "-"], capture_output=True, text=True)
        return result.stdout if result.returncode == 0 else None
    except Exception as e:
        print(f"pdftotext error: {e}")
        return None

def main():
    start_print = 1950
    end_print = 1978
    results = {}
    
    for p_nr in range(start_print, end_print + 1):
        print(f"Processing Print {p_nr}...")
        pdf_path = download_pdf(str(p_nr))
        if pdf_path:
            text = extract_text_from_pdf(pdf_path)
            if text:
                results[str(p_nr)] = text[:20000] # Limit size for JSON
            if os.path.exists(pdf_path):
                os.remove(pdf_path)
        time.sleep(0.5)
    
    with open("temp_texts_batch4.json", "w") as f:
        json.dump(results, f)
    print(f"Done. Extracted {len(results)} texts to temp_texts_batch4.json")

if __name__ == "__main__":
    main()
