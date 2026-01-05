import psycopg2
from psycopg2.extras import execute_values
import re
import json
from keyword_map import CATEGORY_KEYWORDS

# DB Config
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

# --- ENHANCED ARGUMENTS DICTIONARY ---
# Map specific keywords to specific Pros/Cons
KEYWORD_ARGUMENTS = {
    "wotum nieufności": {
        "pros": ["Weryfikacja działań rządu", "Realizacja funkcji kontrolnej Sejmu", "Debata nad stanem państwa"],
        "cons": ["Destabilizacja prac rządu", "Element walki politycznej", "Ryzyko kryzysu gabinetowego"]
    },
    "odwołanie członka": {
        "pros": ["Zmiana personalna w organie państwa", "Rozliczenie z działalności"],
        "cons": ["Przerwanie ciągłości prac", "Upolitycznienie kadencji"]
    },
    "wybór członka": {
        "pros": ["Uzupełnienie wakatów", "Umożliwienie funkcjonowania instytucji"],
        "cons": ["Możliwe kontrowersje wokół kandydata", "Dominacja większości sejmowej"]
    },
    "podat": {
        "pros": ["Uszczelnienie systemu podatkowego", "Dostosowanie prawa do wymogów UE", "Zwiększenie dochodów budżetu"],
        "cons": ["Większe obciążenia dla podatników", "Możliwy wzrost biurokracji", "Ryzyko interpretacyjne"]
    },
    "vat": {
        "pros": ["Uszczelnienie luki VAT", "Uproszczenie rozliczeń dla części firm"],
        "cons": ["Zmiana stawek dla konsumentów", "Skomplikowanie mechanizmu split payment"]
    },
    "budżet": {
        "pros": ["Zapewnienie finansowania usług publicznych", "Stabilizacja fiskalna", "Realizacja programów rządowych"],
        "cons": ["Wzrost deficytu budżetowego", "Niewystarczające środki na niektóre sektory", "Wzrost kosztów obsługi długu"]
    },
    "referendum": {
        "pros": ["Bezpośredni wpływ obywateli na prawo", "Wzmocnienie demokracji", "Jasny mandat społeczny"],
        "cons": ["Wysokie koszty organizacji", "Możliwość manipulacji pytaniami", "Ryzyko polaryzacji społecznej"]
    },
    "komisj": {
        "pros": ["Zbadanie nieprawidłowości", "Jawność życia publicznego", "Wyciągnięcie konsekwencji"],
        "cons": ["Długotrwałość postępowania", "Ryzyko wykorzystania do celów politycznych", "Dublowanie działań prokuratury"]
    },
    "unij": {
        "pros": ["Harmonizacja prawa z UE", "Uniknięcie kar finansowych", "Poprawa współpracy międzynarodowej"],
        "cons": ["Ograniczenie pewnych swobód krajowych", "Koszty dostosowawcze dla firm", "Zwiększona biurokracja"]
    },
    "uchwał": {
        "pros": ["Wyrażenie stanowiska Sejmu", "Upamiętnienie ważnych wydarzeń", "Symboliczne wsparcie"],
        "cons": ["Brak skutków prawnych", "Charakter czysto deklaratywny", "Zajmowanie czasu obrad"]
    },
    "obron": {
        "pros": ["Wzmocnienie potencjału obronnego", "Modernizacja sprzętowa", "Bezpieczeństwo granic"],
        "cons": ["Bardzo wysokie koszty", "Długi okres wdrażania", "Konieczność szkolenia kadr"]
    },
    "szkol": {
        "pros": ["Podniesienie jakości edukacji", "Dostosowanie do rynku pracy", "Wsparcie dla uczniów"],
        "cons": ["Obciążenie dla nauczycieli", "Koszty zmian programowych", "Ryzyko chaosu organizacyjnego"]
    },
    "zdrow": {
        "pros": ["Lepszy dostęp do leczenia", "Nowoczesne procedury medyczne", "Wsparcie kadr medycznych"],
        "cons": ["Niewystarczające finansowanie", "Brak kadr do realizacji zadań", "Długi czas oczekiwania na efekty"]
    },
    "pomoc": {
        "pros": ["Wsparcie najuboższych", "Solidarność społeczna", "Interwencja w sytuacjach kryzysowych"],
        "cons": ["Możliwość nadużyć", "Obciążenie systemu pomocy społecznej", "Wysokie koszty transferów"]
    }
}

DEFAULT_PROS = ["Realizacja założonych celów ustawowych", "Dostosowanie prawa do aktualnych potrzeb", "Uporządkowanie stanu prawnego"]
DEFAULT_CONS = ["Możliwe trudności interpretacyjne", "Koszty wdrożenia zmian", "Krótkie vacatio legis"]

def clean_text(text):
    if not text: return ""
    clean = re.sub(r'^(Pkt\.|Punkt)\s*\d+\.?\s*', '', text, flags=re.IGNORECASE)
    clean = re.sub(r'\s*\(druki?.*?\)', '', clean, flags=re.IGNORECASE)
    return clean.strip()

def generate_heuristic_analysis():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("🧠 Starting Heuristic Analysis Engine (Rule-Based)...")
    
    # Fetch all votes
    cur.execute("SELECT id, title_clean, verdict, category FROM votes ORDER BY date DESC")
    votes = cur.fetchall()
    
    total = len(votes)
    print(f"📊 Processing {total} votes...")
    
    batch_data = []
    
    for idx, row in enumerate(votes):
        vote_id, title, verdict, category = row
        title_lower = title.lower()
        
        # 1. Generate Summary
        summary = ""
        action_verb = "rozpatrzył"
        if verdict == 'PRZYJĘTO':
            action_verb = "przyjął"
        elif verdict == 'ODRZUCONO':
            action_verb = "odrzucił"
        
        # Determine topic specifics
        specific_topics = []
        
        # Look for category keywords in title
        found_keywords = []
        if category in CATEGORY_KEYWORDS:
            for kw in CATEGORY_KEYWORDS[category]:
                if kw in title_lower:
                    found_keywords.append(kw)
        
        # If no category keywords found, search globally
        if not found_keywords:
            for cat, kws in CATEGORY_KEYWORDS.items():
                for kw in kws:
                    if kw in title_lower:
                        found_keywords.append(kw)
                        break # One per category is enough
        
        # Construct summary
        if "sprawozdanie komisji" in title_lower:
            summary = f"Sejm {action_verb} sprawozdanie komisji dotyczące projektu: {title}."
        elif "wotum nieufności" in title_lower:
            target = "rządu"
            if "ministra" in title_lower: target = "ministra"
            summary = f"Głosowanie nad wotum nieufności dla {target}. Sejm {action_verb} wniosek."
        elif "wybór" in title_lower and "komisji" in title_lower:
             summary = f"Głosowanie personalne dotyczące składu komisji sejmowych."
        else:
             summary = f"Sejm {action_verb} projekt dotyczący kategorii {category}. "
             if found_keywords:
                 # Clean up keywords for display (simple heuristic)
                 display_kws = [k for k in found_keywords if len(k) > 3][:3]
                 if display_kws:
                     summary += f"Główne zagadnienia: {', '.join(display_kws)}."
             else:
                 summary += f"Dotyczy: {title[:100]}..."

        # 2. Generate Pros/Cons
        pros = []
        cons = []
        
        # Search for specific arguments in KEYWORD_ARGUMENTS
        matched_args = False
        for kw, args in KEYWORD_ARGUMENTS.items():
            if kw in title_lower:
                pros.extend(args["pros"])
                cons.extend(args["cons"])
                matched_args = True
                break # Use the first strong match
        
        if not matched_args:
            # Fallback based on Category
            if category == 'EKONOMIA' or category == 'GOSPODARKA':
                pros = ["Wsparcie rozwoju gospodarczego", "Ułatwienia dla przedsiębiorców"]
                cons = ["Ryzyko wzrostu kosztów prowadzenia firmy", "Zwiększenie biurokracji"]
            elif category == 'ZDROWIE':
                pros = KEYWORD_ARGUMENTS["zdrow"]["pros"]
                cons = KEYWORD_ARGUMENTS["zdrow"]["cons"]
            elif category == 'OBRONNOŚĆ':
                pros = KEYWORD_ARGUMENTS["obron"]["pros"]
                cons = KEYWORD_ARGUMENTS["obron"]["cons"]
            else:
                pros = DEFAULT_PROS
                cons = DEFAULT_CONS
        
        # JSON formatting
        pros_json = json.dumps(pros[:3], ensure_ascii=False)
        cons_json = json.dumps(cons[:3], ensure_ascii=False)
        
        batch_data.append((vote_id, summary, pros_json, cons_json))
        
        # Execute Batch
        if len(batch_data) >= 500:
            upsert_query = """
            INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
            VALUES %s
            ON CONFLICT (vote_id) DO UPDATE SET
                summary = EXCLUDED.summary,
                pros = EXCLUDED.pros,
                cons = EXCLUDED.cons,
                created_at = NOW();
            """
            execute_values(cur, upsert_query, batch_data, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")
            conn.commit()
            print(f"  Processed batch up to {idx+1}/{total}")
            batch_data = []

    # Final batch
    if batch_data:
        upsert_query = """
        INSERT INTO vote_analyses (vote_id, summary, pros, cons, created_at)
        VALUES %s
        ON CONFLICT (vote_id) DO UPDATE SET
            summary = EXCLUDED.summary,
            pros = EXCLUDED.pros,
            cons = EXCLUDED.cons,
            created_at = NOW();
        """
        execute_values(cur, upsert_query, batch_data, template="(%s, %s, %s::jsonb, %s::jsonb, NOW())")
        conn.commit()
    
    print("\n✅ Heuristic Analysis Generation Complete!")
    conn.close()

if __name__ == "__main__":
    generate_heuristic_analysis()
