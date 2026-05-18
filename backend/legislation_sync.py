import os
import requests
import json

SEJM_API_BASE = "https://api.sejm.gov.pl/sejm/term10"
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH = os.path.join(PROJECT_DIR, "frontend", "data", "legislation.json")

def sync():
    print(">>> Pobieranie druków sejmowych...")
    try:
        resp = requests.get(f"{SEJM_API_BASE}/prints", timeout=30)
    except Exception as e:
        print(f"✗ Błąd połączenia z API Sejmu: {e}")
        return
        
    if resp.status_code != 200:
        print(f"✗ Błąd pobierania druków: {resp.status_code}")
        return
        
    prints = resp.json()
    print(f"✓ Pobrano {len(prints)} druków. Filtrowanie...")
    
    gov_items = []
    pres_items = []
    
    for p in prints:
        title = p.get('title', '')
        title_lower = title.strip().lower()
        
        is_gov = False
        is_pres = False
        
        # Filtrujemy precyzyjnie rządowe i prezydenckie inicjatywy (projekty ustaw/uchwał oraz weta)
        if title_lower.startswith("rządowy projekt ustawy") or title_lower.startswith("rządowy projekt uchwały"):
            is_gov = True
        elif title_lower.startswith("przedstawiony przez prezydenta rzeczypospolitej polskiej") or title_lower.startswith("wniosek prezydenta rp o ponowne rozpatrzenie"):
            is_pres = True
            
        date_str = p.get('documentDate') or p.get('deliveryDate') or ""
        
        # Oczyszczamy tytuł dla lepszej prezentacji wizualnej
        display_title = title.replace("\n", " ").replace("  ", " ").strip()
        
        # Krótki opis w zależności od typu
        if "ustawy" in title_lower:
            doc_type = "Projekt Ustawy"
        elif "uchwały" in title_lower:
            doc_type = "Projekt Uchwały"
        elif "ponowne rozpatrzenie" in title_lower:
            doc_type = "Weto Prezydenckie"
        else:
            doc_type = "Inicjatywa"

        item = {
            "id": p.get('number'),
            "title": display_title,
            "date": date_str,
            "type": doc_type,
            "url": f"https://www.sejm.gov.pl/sejm10.nsf/druk.xsp?nr={p.get('number')}"
        }
        
        if is_gov:
            gov_items.append(item)
        elif is_pres:
            pres_items.append(item)
            
    # Sortujemy chronologicznie od najnowszych
    gov_items.sort(key=lambda x: x['date'], reverse=True)
    pres_items.sort(key=lambda x: x['date'], reverse=True)
    
    # Tworzymy ostateczną strukturę
    data = {
        "meta": {
            "updated_at": p.get('changeDate') or "",
            "total_government": len(gov_items),
            "total_president": len(pres_items)
        },
        "government": gov_items[:25],  # 25 najnowszych projektów rządowych
        "president": pres_items[:25]   # 25 najnowszych projektów prezydenckich
    }
    
    # Zapewniamy istnienie katalogu frontend/data
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"✓ Sukces: zsynchronizowano {len(gov_items)} rządowych, {len(pres_items)} prezydenckich.")
    print(f"✓ Zapisano do {OUTPUT_PATH}")

if __name__ == "__main__":
    sync()
