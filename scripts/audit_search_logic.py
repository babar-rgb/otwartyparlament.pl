
import subprocess
import json

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"

# Replicating the logic from searchContext.ts
CONTEXT_MAP = {
    'drożyzna': ['inflacja', 'ceny', 'podatek', 'vat', 'akcyza', 'koszt życia', 'podwyżka', 'gospodarka', 'budżet'],
    'inflacja': ['drożyzna', 'ceny', 'nbp', 'stopy procentowe', 'gospodarka', 'budżet', 'podatek'],
    'kredyt': ['hipoteka', 'bank', 'rata', 'oprocentowanie', 'frankowicz', 'pożyczka', 'nbp'],
    'mieszkanie': ['kredyt', 'hipoteka', 'deweloper', 'najem', 'lokator', 'budownictwo', 'bezpieczny kredyt'],
    'praca': ['zatrudnienie', 'bezrobocie', 'płaca', 'minimalna', 'umowa', 'kodeks pracy', 'zus'],
    'lekarz': ['zdrowie', 'szpital', 'nfz', 'pacjent', 'medycyna', 'leczenie', 'recepta'],
    'szkoła': ['edukacja', 'nauczyciel', 'uczeń', 'oświata', 'reforma', 'program nauczania'],
    'wojna': ['ukraina', 'obronność', 'wojsko', 'nato', 'bezpieczeństwo', 'granica'],
    'sąd': ['sprawiedliwość', 'sędzia', 'trybunał', 'krs', 'wyrok', 'prawo'],
    'klimat': ['środowisko', 'emisja', 'co2', 'zielona energia', 'oze', 'transformacja'],
    'rolnik': ['rolnictwo', 'wieś', 'dopłaty', 'koła gospodyń', 'arimr', 'uprawy'],
    'samochód': ['drogi', 'paliwo', 'akcyza', 'rejestracja', 'ubezpieczenie', 'transport'],
    'aborcja': ['ciąża', 'kobieta', 'zdrowie reprodukcyjne', 'prawo', 'życie'],
    'media': ['tvp', 'radio', 'prasa', 'dziennikarstwo', 'abonament']
}

def expand_query(query):
    query = query.lower().strip()
    terms = set([query])
    
    # Direct
    if query in CONTEXT_MAP:
        terms.update(CONTEXT_MAP[query])
    
    # Reverse (naive for script)
    for key, values in CONTEXT_MAP.items():
        if query in values:
            terms.add(key)
            
    return list(terms)

def build_tsvector_query(terms):
    processed = []
    for t in terms:
        t = t.strip()
        if not t:
            continue
            
        # Handle multi-word terms like "koszt życia" -> "(koszt <-> życia)"
        if ' ' in t:
            parts = t.split()
            stemmed_parts = []
            for p in parts:
                if len(p) > 4:
                    stemmed_parts.append(f"{p[:-1]}:*")
                else:
                    stemmed_parts.append(f"{p}:*")
            processed.append(f"({' <-> '.join(stemmed_parts)})")
        else:
            if len(t) > 4:
                processed.append(f"{t[:-1]}:*")
            else:
                processed.append(f"{t}:*")
                
    return ' | '.join(processed)

def run_db_query(search_pattern):
    sql = f"""
    SELECT count(*) 
    FROM view_search_all 
    WHERE to_tsvector('simple', title) @@ to_tsquery('simple', '{search_pattern}');
    """
    cmd = [PSQL, "-d", DB, "-t", "-c", sql]
    res = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return int(res.stdout.strip())
    except:
        return 0

def main():
    print(f"{'QUERY':<15} {'RAW HITS':<10} {'EXPANDED HITS':<15} {'GAIN'}")
    print("-" * 50)
    
    test_queries = list(CONTEXT_MAP.keys())
    
    for q in test_queries:
        # Raw Search
        raw_terms = [q]
        raw_pattern = build_tsvector_query(raw_terms)
        raw_count = run_db_query(raw_pattern)
        
        # Expanded Search
        expanded_terms = expand_query(q)
        expanded_pattern = build_tsvector_query(expanded_terms)
        expanded_count = run_db_query(expanded_pattern)
        
        gain = ""
        if raw_count == 0 and expanded_count > 0:
            gain = "🚀 ZERO TO HERO"
        elif expanded_count > raw_count * 2:
            gain = "🔥 MASSIVE UX"
        elif expanded_count > raw_count:
            gain = "✅ IMPROVED"
        
        print(f"{q:<15} {raw_count:<10} {expanded_count:<15} {gain}")

if __name__ == "__main__":
    main()
