#!/usr/bin/env python3
"""
OCR Asset Declarations with Gemini Vision
Extracts structured data from PDF scans of oświadczenia majątkowe
"""

import os
import sys
import json
import time
from typing import Optional, Dict
import google.generativeai as genai
from sqlalchemy import text
from tqdm import tqdm

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core import orm_db as database

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY not set")
    sys.exit(1)

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-001')

RATE_LIMIT_DELAY = 2.0  # 2 seconds between requests
MAX_RETRIES = 3

def create_ocr_prompt() -> str:
    """Create prompt for extracting structured data from declaration"""
    
    return """Jesteś ekspertem od polskich oświadczeń majątkowych posłów.

ZADANIE: Wyciągnij strukturalne dane z tego oświadczenia majątkowego.

WYCIĄGNIJ:
1. **Dochody** (z różnych źródeł: posła, małżonka, dzieci)
2. **Nieruchomości** (mieszkania, domy, działki - powierzchnia, wartość)
3. **Ruchomości** (samochody, motocykle - marka, model, rok)
4. **Środki pieniężne** (gotówka, rachunki bankowe, oszczędności)
5. **Papiery wartościowe** (akcje, obligacje, udziały w spółkach)
6. **Zobowiązania** (kredyty, pożyczki, długi)

FORMAT ODPOWIEDZI (TYLKO JSON):
{
  "income": {
    "mp": 250000,
    "spouse": 120000,
    "children": 0,
    "total": 370000,
    "sources": ["posel", "wynajem", "działalność gospodarcza"]
  },
  "real_estate": [
    {
      "type": "mieszkanie",
      "location": "Warszawa",
      "area_m2": 85,
      "value": 800000,
      "ownership": "współwłasność małżeńska"
    }
  ],
  "vehicles": [
    {
      "type": "samochód osobowy",
      "brand": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "value": 80000
    }
  ],
  "cash_and_savings": {
    "cash": 50000,
    "bank_accounts": 200000,
    "total": 250000
  },
  "securities": [
    {
      "type": "akcje",
      "company": "PKO BP",
      "quantity": 1000,
      "value": 50000
    }
  ],
  "liabilities": [
    {
      "type": "kredyt hipoteczny",
      "creditor": "PKO BP",
      "amount": 400000,
      "purpose": "zakup mieszkania"
    }
  ],
  "total_assets": 1380000,
  "total_liabilities": 400000,
  "net_worth": 980000
}

WAŻNE:
- Jeśli brak danych w danej kategorii - zwróć pustą listę [] lub 0
- Wartości w PLN
- Powierzchnie w m²
- Bądź precyzyjny z liczbami
"""

def parse_declaration_with_gemini(pdf_path: str) -> Optional[Dict]:
    """Use Gemini to parse declaration PDF"""
    
    prompt = create_ocr_prompt()
    
    for attempt in range(MAX_RETRIES):
        try:
            # Upload PDF to Gemini
            uploaded_file = genai.upload_file(pdf_path)
            
            # Wait for processing
            while uploaded_file.state.name == "PROCESSING":
                time.sleep(1)
                uploaded_file = genai.get_file(uploaded_file.name)
            
            if uploaded_file.state.name == "FAILED":
                print(f"⚠️  File upload failed")
                return None
            
            # Generate content with PDF
            response = model.generate_content(
                [prompt, uploaded_file],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=2000,
                )
            )
            
            # Delete uploaded file
            genai.delete_file(uploaded_file.name)
            
            text = response.text.strip()
            
            # Remove markdown code blocks
            if text.startswith('```'):
                text = text.split('```')[1]
                if text.startswith('json'):
                    text = text[4:]
            
            data = json.loads(text)
            return data
            
        except json.JSONDecodeError as e:
            print(f"⚠️  JSON parse error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            if attempt == MAX_RETRIES - 1:
                print(f"Response: {response.text[:500]}")
                return None
            time.sleep(2 ** attempt)
            
        except Exception as e:
            print(f"⚠️  OCR error (attempt {attempt + 1}/{MAX_RETRIES}): {e}")
            if attempt == MAX_RETRIES - 1:
                return None
            time.sleep(2 ** attempt)
    
    return None

def save_parsed_data(db, declaration_id: int, parsed_data: Dict):
    """Save parsed data to database"""
    
    conn = db.connection().connection
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            """
            UPDATE asset_declarations
            SET parsed_content = %s::jsonb,
                summary = %s
            WHERE id = %s
            """,
            (
                json.dumps(parsed_data),
                f"Majątek netto: {parsed_data.get('net_worth', 0):,} PLN",
                declaration_id
            )
        )
        conn.commit()
    except Exception as e:
        print(f"⚠️  Error saving declaration {declaration_id}: {e}")
        conn.rollback()

def main():
    print("📄 Asset Declaration OCR with Gemini Vision")
    print()
    
    db = database.get_db().__next__()
    
    # Get declarations without parsed content
    result = db.execute(text("""
        SELECT id, mp_id, year, file_path
        FROM asset_declarations
        WHERE file_path IS NOT NULL
        AND parsed_content IS NULL
        ORDER BY year DESC
    """))
    
    declarations = []
    for row in result:
        declarations.append({
            'id': row[0],
            'mp_id': row[1],
            'year': row[2],
            'file_path': row[3]
        })
    
    total = len(declarations)
    print(f"📊 Found {total} declarations to parse")
    
    if total == 0:
        print("✅ All declarations already parsed!")
        return
    
    # Estimate cost
    print(f"\n💰 Estimated cost: ${total * 0.002:.2f} (Gemini Vision)")
    print(f"⏱️  Estimated time: {total * RATE_LIMIT_DELAY / 60:.1f} minutes")
    
    response = input("\nProceed? (y/n): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return
    
    # Process declarations
    processed = 0
    failed = 0
    
    with tqdm(total=total, desc="Parsing declarations") as pbar:
        for decl in declarations:
            # Check if file exists
            if not os.path.exists(decl['file_path']):
                print(f"\n⚠️  File not found: {decl['file_path']}")
                failed += 1
                pbar.update(1)
                continue
            
            # Parse with Gemini
            parsed_data = parse_declaration_with_gemini(decl['file_path'])
            
            if parsed_data:
                save_parsed_data(db, decl['id'], parsed_data)
                processed += 1
            else:
                failed += 1
            
            pbar.update(1)
            time.sleep(RATE_LIMIT_DELAY)
    
    print(f"\n✅ OCR complete!")
    print(f"   Processed: {processed}")
    print(f"   Failed: {failed}")
    print(f"   Success rate: {processed/(processed+failed)*100:.1f}%")

if __name__ == "__main__":
    main()
