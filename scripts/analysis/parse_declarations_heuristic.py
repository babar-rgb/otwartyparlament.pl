#!/usr/bin/env python3
"""
Parse asset declarations PDFs using heuristic rules - NO AI REQUIRED.
Downloads PDFs and extracts numerical values using regex patterns.

Parsed fields:
- savings (oszczędności)
- income (dochód)
- real_estate (nieruchomości)
- cars (samochody)
"""

import subprocess
import requests
import tempfile
import re
import os
import time
from io import BytesIO

# Try to import different PDF parsers
try:
    import fitz  # PyMuPDF
    PDF_ENGINE = 'pymupdf'
except ImportError:
    try:
        import pdfplumber
        PDF_ENGINE = 'pdfplumber'
    except ImportError:
        PDF_ENGINE = None
        print("Warning: No PDF parser available. Install pymupdf or pdfplumber")

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}


def run_sql(query):
    """Execute SQL and return output"""
    cmd = [PSQL, '-d', DB, '-At', '-c', query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return None
    return result.stdout.strip()


def update_sql(query):
    """Execute SQL update"""
    cmd = [PSQL, '-d', DB, '-c', query]
    subprocess.run(cmd, capture_output=True)


def download_pdf(url):
    """Download PDF and return content"""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        if resp.status_code == 200 and resp.content[:4] == b'%PDF':
            return resp.content
    except:
        pass
    return None


def extract_text_pymupdf(pdf_content):
    """Extract text using PyMuPDF"""
    try:
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except:
        return ""


def extract_text_pdfplumber(pdf_content):
    """Extract text using pdfplumber"""
    try:
        import pdfplumber
        with pdfplumber.open(BytesIO(pdf_content)) as pdf:
            text = ""
            for page in pdf.pages:
                text += page.extract_text() or ""
            return text
    except:
        return ""


def extract_text(pdf_content):
    """Extract text from PDF"""
    if PDF_ENGINE == 'pymupdf':
        return extract_text_pymupdf(pdf_content)
    elif PDF_ENGINE == 'pdfplumber':
        return extract_text_pdfplumber(pdf_content)
    return ""


def parse_money(text):
    """Parse Polish money format to float"""
    if not text:
        return 0.0
    text = text.replace(' ', '').replace(',', '.').replace('zł', '').replace('PLN', '')
    text = re.sub(r'[^\d.]', '', text)
    try:
        return float(text)
    except:
        return 0.0


def extract_savings(text):
    """Extract savings from declaration text"""
    savings = 0.0
    
    # Pattern 1: "środki pieniężne" section
    patterns = [
        r'środki\s+pieniężne.*?(\d[\d\s,.]*)\s*(zł|PLN|złotych)',
        r'oszczędności.*?(\d[\d\s,.]*)\s*(zł|PLN|złotych)',
        r'zgromadzone\s+środki.*?(\d[\d\s,.]*)\s*(zł|PLN|złotych)',
        r'na\s+rachunkach.*?(\d[\d\s,.]*)\s*(zł|PLN|złotych)',
        r'w\s+walucie\s+polskiej.*?(\d[\d\s,.]*)\s*(zł|PLN)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            amount = parse_money(match[0])
            if amount > savings:
                savings = amount
    
    # Pattern for EUR/USD (convert approximately)
    eur_pattern = r'(\d[\d\s,.]*)\s*(EUR|euro)'
    usd_pattern = r'(\d[\d\s,.]*)\s*(USD|dolar)'
    
    for match in re.findall(eur_pattern, text, re.IGNORECASE):
        amount = parse_money(match[0]) * 4.3  # Approximate EUR->PLN
        savings += amount
    
    for match in re.findall(usd_pattern, text, re.IGNORECASE):
        amount = parse_money(match[0]) * 4.0  # Approximate USD->PLN
        savings += amount
    
    return round(savings, 2)


def extract_income(text):
    """Extract annual income from declaration"""
    income = 0.0
    
    patterns = [
        r'dochód\s+z\s+tytułu.*?(\d[\d\s,.]*)\s*(zł|PLN)',
        r'wynagrodzenie.*?(\d[\d\s,.]*)\s*(zł|PLN)',
        r'pensja.*?(\d[\d\s,.]*)\s*(zł|PLN)',
        r'dieta\s+poselska.*?(\d[\d\s,.]*)\s*(zł|PLN)',
        r'przychód.*?(\d[\d\s,.]*)\s*(zł|PLN)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            amount = parse_money(match[0])
            income += amount
    
    return round(income, 2)


def extract_real_estate(text):
    """Extract real estate items"""
    properties = []
    
    # Look for common patterns
    patterns = [
        r'(dom|mieszkanie|lokal|działka|grunt)[\w\s]*?(\d+[,.]?\d*)\s*(m2|m²|ha|ar)',
        r'nieruchomość[\w\s]*?(\d+[,.]?\d*)\s*(m2|m²|ha|ar)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match) >= 3:
                prop_type = match[0].capitalize()
                size = match[1]
                unit = match[2]
                properties.append(f"{prop_type} {size} {unit}")
    
    return list(set(properties))[:10]  # Limit to 10


def extract_cars(text):
    """Extract car information"""
    cars = []
    
    # Common car brands
    brands = ['audi', 'bmw', 'mercedes', 'volkswagen', 'toyota', 'honda', 'ford', 
              'opel', 'skoda', 'volvo', 'renault', 'peugeot', 'citroen', 'fiat',
              'hyundai', 'kia', 'nissan', 'mazda', 'seat', 'porsche', 'land rover',
              'jeep', 'lexus', 'subaru', 'alfa romeo', 'chevrolet', 'suzuki']
    
    text_lower = text.lower()
    for brand in brands:
        if brand in text_lower:
            # Try to extract model and year
            pattern = rf'{brand}\s+(\w+)?\s*(\d{{4}})?'
            matches = re.findall(pattern, text_lower)
            for match in matches:
                car_info = brand.capitalize()
                if match[0]:
                    car_info += f" {match[0].capitalize()}"
                if match[1]:
                    car_info += f" ({match[1]})"
                cars.append(car_info)
                break
    
    return list(set(cars))[:5]


def generate_summary(savings, income, properties, cars):
    """Generate Polish summary based on parsed data"""
    parts = []
    
    if savings > 1000000:
        parts.append(f"Posiada znaczne oszczędności ({savings:,.0f} PLN)".replace(',', ' '))
    elif savings > 100000:
        parts.append(f"Posiada oszczędności ({savings:,.0f} PLN)".replace(',', ' '))
    elif savings > 0:
        parts.append(f"Posiada niewielkie oszczędności")
    
    if len(properties) > 3:
        parts.append(f"oraz {len(properties)} nieruchomości")
    elif len(properties) > 0:
        parts.append(f"oraz {', '.join(properties[:2])}")
    
    if len(cars) > 0:
        parts.append(f"i samochód {cars[0]}")
    
    if income > 200000:
        parts.append(f". Roczny dochód: {income:,.0f} PLN".replace(',', ' '))
    
    return ' '.join(parts) if parts else "Brak szczegółowych danych majątkowych."


def parse_declaration(pdf_content):
    """Parse PDF and extract all fields"""
    text = extract_text(pdf_content)
    
    if not text or len(text) < 100:
        return None
    
    savings = extract_savings(text)
    income = extract_income(text)
    properties = extract_real_estate(text)
    cars = extract_cars(text)
    summary = generate_summary(savings, income, properties, cars)
    
    return {
        'savings': savings,
        'income': income,
        'real_estate': properties,
        'car': cars,
        'summary': summary
    }


def main():
    print("=" * 60)
    print("  HEURISTIC DECLARATION PARSER (No AI)")
    print("=" * 60)
    
    if PDF_ENGINE is None:
        print("ERROR: No PDF library installed!")
        print("Run: pip install pymupdf")
        return
    
    print(f"Using PDF engine: {PDF_ENGINE}")
    
    # Get declarations without parsed content
    output = run_sql("""
        SELECT id, mp_id, pdf_url 
        FROM asset_declarations 
        WHERE parsed_content IS NULL 
        AND pdf_url LIKE 'https://%'
        ORDER BY mp_id
        LIMIT 200;
    """)
    
    if not output:
        print("No declarations to process or no access to database")
        return
    
    rows = [r for r in output.split('\n') if r.strip()]
    print(f"Found {len(rows)} declarations to parse")
    
    parsed = 0
    failed = 0
    
    for i, row in enumerate(rows):
        parts = row.split('|')
        if len(parts) < 3:
            continue
        
        decl_id = parts[0].strip()
        mp_id = parts[1].strip()
        pdf_url = parts[2].strip()
        
        print(f"[{i+1}/{len(rows)}] MP {mp_id}... ", end='', flush=True)
        
        # Download PDF
        content = download_pdf(pdf_url)
        if not content:
            print("❌ Download failed")
            failed += 1
            continue
        
        # Parse
        result = parse_declaration(content)
        if not result:
            print("❌ Parse failed")
            failed += 1
            continue
        
        # Store in database
        import json
        parsed_json = json.dumps(result, ensure_ascii=False).replace("'", "''")
        summary = result['summary'].replace("'", "''")
        
        update_sql(f"""
            UPDATE asset_declarations 
            SET parsed_content = '{parsed_json}'::jsonb, 
                summary = '{summary}'
            WHERE id = {decl_id};
        """)
        
        print(f"✅ {result['savings']:,.0f} PLN savings".replace(',', ' '))
        parsed += 1
        
        # Rate limit
        time.sleep(0.3)
        
        if (i + 1) % 20 == 0:
            print(f"\n--- Progress: {i+1}/{len(rows)} | Parsed: {parsed} | Failed: {failed} ---\n")
    
    print()
    print("=" * 60)
    print(f"  COMPLETE")
    print(f"  - Parsed: {parsed}")
    print(f"  - Failed: {failed}")
    print("=" * 60)
    
    # Final stats
    total = run_sql("SELECT count(*) FROM asset_declarations WHERE parsed_content IS NOT NULL;")
    print(f"\nTotal declarations with parsed content: {total}")


if __name__ == "__main__":
    main()
