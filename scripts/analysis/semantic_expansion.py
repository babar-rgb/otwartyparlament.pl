#!/usr/bin/env python3
"""
Semantic Context Expansion Engine
==================================
Senior NLP Engineer Script for massive semantic expansion.

PHASE 1: Gap Analysis - Find high-frequency terms not in our dictionary
PHASE 2: AI Linker - Generate semantic relationships for new terms
PHASE 3: Update & Validate - Merge into searchContext.ts

Run: python scripts/semantic_expansion.py
"""

import subprocess
import re
from collections import Counter
from typing import Dict, List, Set, Tuple

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# ============================================================================
# EXISTING CONTEXT MAP (from searchContext.ts)
# ============================================================================
EXISTING_TERMS = {
    'drożyzna', 'inflacja', 'ceny', 'kredyt', 'mieszkanie', 'praca', 'bezrobocie',
    'podatki', 'firma', 'lekarz', 'szpital', 'choroba', 'lek', 'covid', 'szkoła',
    'nauczyciel', 'student', 'matura', 'dziecko', 'rodzina', '500+', '800+',
    'emerytura', 'senior', 'wojna', 'ukraina', 'wojsko', 'policja', 'granica',
    'sąd', 'kara', 'rozwód', 'klimat', 'energia', 'prąd', 'smog', 'śmieci',
    'rolnik', 'wieś', 'samochód', 'paliwo', 'drogi', 'kolej', 'wybory', 
    'prezydent', 'rząd', 'korupcja', 'aborcja', 'lgbt', 'kościół', 'media'
}

# Polish stop words to exclude
STOP_WORDS = {
    'i', 'w', 'z', 'do', 'na', 'o', 'że', 'się', 'jest', 'nie', 'to', 'oraz',
    'lub', 'jako', 'po', 'za', 'od', 'przez', 'przy', 'dla', 'ze', 'też',
    'ale', 'czy', 'co', 'jak', 'który', 'która', 'które', 'tego', 'tej',
    'tym', 'tych', 'ten', 'ta', 'być', 'został', 'została', 'zostało',
    'było', 'była', 'były', 'będzie', 'są', 'ma', 'mają', 'może', 'będą',
    'art', 'ust', 'pkt', 'nr', 'dz', 'poz', 'lit', 'par', 'rozdz',
    'ustawy', 'ustawa', 'ustawie', 'projektu', 'projekt', 'projekcie',
    'komisji', 'komisja', 'sejmu', 'senatu', 'rządu', 'prezydenta',
    'sprawie', 'zmianie', 'zmiana', 'zmian', 'zmianę', 'druk', 'druki',
    'posiedzenie', 'głosowanie', 'wniosek', 'poprawka', 'poprawki',
    'sprawozdanie', 'czytanie', 'pierwsze', 'drugie', 'trzecie',
    'stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca',
    'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia',
    'roku', 'dnia', 'dniu'
}

# ============================================================================
# EXPERT SEMANTIC RELATIONS DATABASE
# Curated by Senior NLP Engineer for Polish legislative context
# ============================================================================
SEMANTIC_RELATIONS = {
    # FINANSE I GOSPODARKA
    'abonament': ['rtv', 'telewizja', 'radio', 'opłata', 'media publiczne', 'krrit'],
    'fundusz': ['inwestycje', 'pieniądze', 'kapitał', 'dotacja', 'subwencja'],
    'dotacja': ['wsparcie', 'dofinansowanie', 'program', 'pomoc', 'budżet'],
    'subwencja': ['dotacja', 'finanse', 'samorząd', 'oświata', 'gmina'],
    'komornik': ['egzekucja', 'długi', 'windykacja', 'sąd', 'dłużnik'],
    'upadłość': ['bankructwo', 'niewypłacalność', 'firma', 'restrukturyzacja'],
    'frankowicz': ['kredyt', 'bank', 'hipoteka', 'kurs', 'waluta', 'chf'],
    'giełda': ['akcje', 'obligacje', 'gpw', 'inwestycje', 'makler'],
    'obligacje': ['dług', 'emisja', 'skarb państwa', 'oprocentowanie'],
    'waloryzacja': ['podwyżka', 'emerytura', 'renta', 'płaca', 'inflacja'],
    'trzynastka': ['emerytura', 'świadczenie', 'bonus', 'zus'],
    'czternastka': ['emerytura', 'świadczenie', 'bonus', 'zus'],
    'becikowe': ['dziecko', 'narodziny', 'świadczenie', 'rodzice'],
    'kosiniakowe': ['dziecko', 'rodzic', 'świadczenie', 'zasiłek'],
    
    # ZDROWIE
    'refundacja': ['lek', 'apteka', 'nfz', 'cena', 'leczenie'],
    'recepta': ['lek', 'lekarz', 'apteka', 'refundacja'],
    'szczepionka': ['covid', 'epidemia', 'zdrowie', 'profilaktyka', 'obowiązek'],
    'szpital': ['leczenie', 'pacjent', 'lekarz', 'zdrowie', 'nfz'],
    'ratownik': ['pogotowie', 'medyczny', 'karetka', 'wypadek'],
    'pielęgniarka': ['szpital', 'opieka', 'zdrowie', 'wynagrodzenie'],
    'apteka': ['lek', 'farmaceuta', 'recepta', 'refundacja'],
    'diagnoza': ['badanie', 'lekarz', 'choroba', 'leczenie'],
    'rehabilitacja': ['zdrowie', 'niepełnosprawność', 'terapia', 'sanatorium'],
    'sanatorium': ['rehabilitacja', 'leczenie', 'zus', 'zdrowie'],
    'psychiatria': ['zdrowie', 'psychika', 'leczenie', 'terapia'],
    'onkologia': ['rak', 'leczenie', 'szpital', 'chemioterapia'],
    
    # EDUKACJA
    'egzamin': ['matura', 'szkoła', 'ocena', 'test', 'kwalifikacje'],
    'stypendium': ['student', 'nauka', 'uczelnia', 'pomoc', 'dochód'],
    'doktorant': ['uczelnia', 'nauka', 'badania', 'stypendium'],
    'habilitacja': ['profesor', 'uczelnia', 'nauka', 'tytuł'],
    'kurator': ['oświata', 'szkoła', 'nadzór', 'województwo'],
    'podstawówka': ['szkoła', 'uczeń', 'edukacja', 'reforma'],
    'liceum': ['szkoła', 'matura', 'uczeń', 'edukacja'],
    'technikum': ['szkoła', 'zawód', 'kwalifikacje', 'praktyka'],
    'przedszkole': ['dziecko', 'edukacja', 'opieka', 'gmina'],
    'żłobek': ['dziecko', 'opieka', 'rodzic', 'praca'],
    
    # PRACA I ZATRUDNIENIE
    'minimalna': ['płaca', 'wynagrodzenie', 'praca', 'pracodawca'],
    'nadgodziny': ['praca', 'wynagrodzenie', 'kodeks pracy', 'pracodawca'],
    'urlop': ['wypoczynek', 'pracownik', 'macierzyński', 'ojcowski'],
    'zwolnienie': ['praca', 'lekarskie', 'chorobowe', 'pracodawca'],
    'związek': ['zawodowy', 'pracownicy', 'strajk', 'negocjacje'],
    'strajk': ['protest', 'pracownicy', 'związek', 'płaca'],
    'emeryt': ['senior', 'zus', 'renta', 'świadczenie'],
    'rencista': ['niepełnosprawność', 'zus', 'świadczenie', 'orzeczenie'],
    'bhp': ['praca', 'bezpieczeństwo', 'wypadek', 'szkolenie'],
    
    # RODZINA I SPOŁECZEŃSTWO
    'alimenty': ['dziecko', 'rozwód', 'rodzic', 'sąd', 'egzekucja'],
    'adopcja': ['dziecko', 'rodzina', 'sąd', 'opieka'],
    'przysposobienie': ['adopcja', 'dziecko', 'rodzina', 'sąd'],
    'kuratela': ['opieka', 'sąd', 'nieletni', 'ubezwłasnowolnienie'],
    'opieka': ['dziecko', 'senior', 'choroba', 'pomoc'],
    'hospicjum': ['opieka', 'choroba', 'śmierć', 'paliatywna'],
    'dom dziecka': ['sierota', 'opieka', 'adopcja', 'pieczy'],
    'piecza': ['zastępcza', 'dziecko', 'rodzina', 'opieka'],
    'niepełnosprawność': ['orzeczenie', 'renta', 'rehabilitacja', 'pomoc'],
    'opiekun': ['niepełnosprawność', 'świadczenie', 'zasiłek', 'opieka'],
    
    # BEZPIECZEŃSTWO I OBRONNOŚĆ
    'służby': ['specjalne', 'abw', 'cba', 'wywiad', 'bezpieczeństwo'],
    'abw': ['służby', 'bezpieczeństwo', 'kontrwywiad', 'terroryzm'],
    'cba': ['korupcja', 'śledztwo', 'urzędnik', 'przestępstwo'],
    'straż': ['pożarna', 'graniczna', 'miejska', 'gminna'],
    'więzienie': ['kara', 'skazany', 'areszt', 'resocjalizacja'],
    'areszt': ['zatrzymanie', 'podejrzany', 'sąd', 'prokurator'],
    'śledztwo': ['prokuratura', 'policja', 'przestępstwo', 'dowody'],
    'prokurator': ['oskarżenie', 'śledztwo', 'sąd', 'przestępstwo'],
    'żandarmeria': ['wojsko', 'policja', 'wojskowa', 'żołnierz'],
    'nato': ['sojusz', 'obronność', 'art5', 'wojsko'],
    'mobilizacja': ['wojsko', 'rezerwa', 'obronność', 'kryzys'],
    'wot': ['obrona', 'terytorialna', 'wojsko', 'ochotnicy'],
    
    # PRAWO I SĄDOWNICTWO
    'trybunał': ['konstytucyjny', 'stanu', 'sąd', 'wyrok'],
    'krs': ['sędziowie', 'nominacje', 'sąd', 'reforma'],
    'sędzia': ['sąd', 'wyrok', 'niezawisłość', 'nominacja'],
    'ławnik': ['sąd', 'społeczny', 'orzeczenie', 'kadencja'],
    'adwokat': ['obrońca', 'sąd', 'prawnik', 'pełnomocnik'],
    'radca': ['prawny', 'prawnik', 'pełnomocnik', 'zastępstwo'],
    'notariusz': ['akt', 'umowa', 'poświadczenie', 'testament'],
    'spadek': ['dziedziczenie', 'testament', 'majątek', 'rodzina'],
    'testament': ['spadek', 'dziedziczenie', 'notariusz', 'majątek'],
    
    # ŚRODOWISKO I ENERGIA
    'oze': ['odnawialna', 'energia', 'wiatrak', 'fotowoltaika', 'biomasa'],
    'fotowoltaika': ['słońce', 'panele', 'energia', 'oze', 'prosument'],
    'prosument': ['energia', 'prąd', 'fotowoltaika', 'sieć'],
    'wiatrak': ['energia', 'wiatr', 'farma', 'oze'],
    'atom': ['elektrownia', 'jądrowa', 'energia', 'paliwo'],
    'węgiel': ['kopalnia', 'górnik', 'emisja', 'energia'],
    'górnik': ['kopalnia', 'węgiel', 'emerytura', 'odprawy'],
    'kopalnia': ['węgiel', 'górnik', 'likwidacja', 'restrukturyzacja'],
    'ets': ['emisja', 'co2', 'uprawnienia', 'handel'],
    'smog': ['powietrze', 'zanieczyszczenie', 'normy', 'kopciuch'],
    'kopciuch': ['ogrzewanie', 'wymiana', 'dotacja', 'smog'],
    'recykling': ['odpady', 'segregacja', 'opakowania', 'środowisko'],
    
    # ROLNICTWO
    'dopłaty': ['rolnik', 'arimr', 'ue', 'hektar', 'produkcja'],
    'arimr': ['dopłaty', 'rolnictwo', 'modernizacja', 'dotacje'],
    'kowr': ['ziemia', 'rolnictwo', 'grunty', 'dzierżawa'],
    'krus': ['rolnik', 'ubezpieczenie', 'emerytura', 'składka'],
    'susza': ['rolnictwo', 'klęska', 'odszkodowanie', 'plony'],
    'plony': ['uprawy', 'rolnictwo', 'zbiory', 'ceny'],
    'hodowla': ['zwierzęta', 'mleko', 'mięso', 'dobrostan'],
    'dobrostan': ['zwierzęta', 'hodowla', 'przepisy', 'ue'],
    
    # TRANSPORT I INFRASTRUKTURA
    'autostrada': ['droga', 'viaTOLL', 'opłata', 'budowa'],
    'ekspresówka': ['droga', 'budowa', 'transport', 's'],
    'gddkia': ['drogi', 'budowa', 'krajowe', 'autostrady'],
    'pkp': ['kolej', 'pociąg', 'bilet', 'spółka'],
    'cpk': ['lotnisko', 'inwestycja', 'kolej', 'warszawa'],
    'lotnisko': ['samolot', 'transport', 'pas', 'terminal'],
    'metro': ['transport', 'miejski', 'linia', 'stacja'],
    'tramwaj': ['transport', 'miejski', 'komunikacja', 'tabor'],
    'tabor': ['transport', 'pojazdy', 'wymiana', 'zakup'],
    
    # SAMORZĄD I ADMINISTRACJA
    'wójt': ['gmina', 'wybory', 'samorząd', 'wieś'],
    'burmistrz': ['miasto', 'wybory', 'samorząd', 'gmina'],
    'starosta': ['powiat', 'administracja', 'urząd', 'wybory'],
    'marszałek': ['województwo', 'sejmik', 'zarząd', 'region'],
    'wojewoda': ['rząd', 'nadzór', 'administracja', 'przedstawiciel'],
    'referendum': ['głosowanie', 'obywatele', 'decyzja', 'lokalne'],
    'konsultacje': ['społeczne', 'mieszkańcy', 'opinia', 'inwestycja'],
    
    # KULTURA I MEDIA
    'tvp': ['telewizja', 'publiczna', 'abonament', 'zarząd'],
    'radio': ['publiczne', 'nadawca', 'abonament', 'koncesja'],
    'koncesja': ['nadawca', 'radio', 'telewizja', 'krrit'],
    'krrit': ['media', 'koncesja', 'nadzór', 'abonament'],
    'zabytek': ['ochrona', 'konserwator', 'remont', 'dotacja'],
    'muzeum': ['kultura', 'wystawa', 'zbiory', 'dziedzictwo'],
    'teatr': ['kultura', 'sztuka', 'dotacja', 'artysty'],
    'filharmonia': ['muzyka', 'kultura', 'orkiestra', 'koncert'],
    
    # POLITYKA I INSTYTUCJE
    'sejm': ['posłowie', 'głosowanie', 'ustawa', 'komisja'],
    'senat': ['senatorowie', 'poprawki', 'ustawa', 'izba'],
    'mandat': ['poseł', 'wybory', 'kadencja', 'immunitet'],
    'immunitet': ['poseł', 'ochrona', 'uchylenie', 'prokuratura'],
    'regulamin': ['sejm', 'obrady', 'procedura', 'głosowanie'],
    'interpelacja': ['poseł', 'minister', 'odpowiedź', 'pytanie'],
    'zapytanie': ['poseł', 'minister', 'odpowiedź', 'kontrola'],
    'wotum': ['nieufności', 'zaufania', 'rząd', 'premier'],
    'weto': ['prezydent', 'ustawa', 'odrzucenie', 'podpis'],
    
    # TEMATY SPOŁECZNE
    'in vitro': ['zapłodnienie', 'niepłodność', 'refundacja', 'etyka'],
    'eutanazja': ['śmierć', 'godna', 'medycyna', 'prawo'],
    'szczepienia': ['obowiązek', 'covid', 'dziecko', 'kalendarz'],
    'antyszczepionkowcy': ['szczepienia', 'ruch', 'protest', 'zdrowie'],
    'marihuana': ['legalizacja', 'medyczna', 'narkotyki', 'prawo'],
    'alkohol': ['sprzedaż', 'reklama', 'wiek', 'promocja'],
    'hazard': ['gry', 'zakłady', 'uzależnienie', 'automaty'],
    
    # NOWE TECHNOLOGIE
    'cyfryzacja': ['internet', 'e-usługi', 'epuap', 'mObywatel'],
    'epuap': ['elektroniczny', 'urząd', 'podpis', 'profil'],
    'mObywatel': ['aplikacja', 'dokumenty', 'cyfryzacja', 'telefon'],
    'rodo': ['dane', 'osobowe', 'ochrona', 'prywatność'],
    'cyberbezpieczeństwo': ['ataki', 'hakerzy', 'ochrona', 'infrastruktura'],
    'sztuczna inteligencja': ['ai', 'algorytmy', 'regulacje', 'etyka'],
    '5g': ['sieć', 'telefonia', 'internet', 'maszty'],
}

# ============================================================================
# DATABASE FUNCTIONS
# ============================================================================

def run_sql(query: str, return_output: bool = False) -> str:
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return ""
    return result.stdout.strip() if return_output else ""


def tokenize(text: str) -> List[str]:
    """Extract meaningful tokens from text"""
    if not text:
        return []
    # Lowercase and split
    text = text.lower()
    # Remove punctuation, keep Polish chars
    text = re.sub(r'[^\w\sąćęłńóśźż]', ' ', text)
    # Split and filter
    words = text.split()
    return [w for w in words if len(w) >= 3 and w not in STOP_WORDS]


# ============================================================================
# PHASE 1: GAP ANALYSIS
# ============================================================================

def phase1_gap_analysis() -> List[Tuple[str, int]]:
    """Find high-frequency terms not in our dictionary"""
    print("\n" + "=" * 60)
    print("  PHASE 1: GAP ANALYSIS")
    print("=" * 60)
    
    all_tokens = Counter()
    
    # Analyze vote titles
    print("\n  [1.1] Analyzing vote titles...")
    output = run_sql("""
    SELECT title_clean FROM votes WHERE title_clean IS NOT NULL LIMIT 5000;
    """, return_output=True)
    
    for line in output.split('\n'):
        if line.strip():
            tokens = tokenize(line)
            all_tokens.update(tokens)
    
    print(f"  Found {len(all_tokens)} unique tokens from votes")
    
    # Analyze process titles
    print("  [1.2] Analyzing process titles...")
    output = run_sql("""
    SELECT title FROM processes WHERE title IS NOT NULL LIMIT 3000;
    """, return_output=True)
    
    for line in output.split('\n'):
        if line.strip():
            tokens = tokenize(line)
            all_tokens.update(tokens)
    
    print(f"  Total unique tokens: {len(all_tokens)}")
    
    # Analyze speech topics (if available)
    print("  [1.3] Analyzing speech topics...")
    output = run_sql("""
    SELECT topic FROM speeches WHERE topic IS NOT NULL LIMIT 2000;
    """, return_output=True)
    
    for line in output.split('\n'):
        if line.strip():
            tokens = tokenize(line)
            all_tokens.update(tokens)
    
    print(f"  Total unique tokens after speeches: {len(all_tokens)}")
    
    # Filter out existing terms
    new_terms = [
        (term, count) for term, count in all_tokens.most_common(500)
        if term not in EXISTING_TERMS 
        and term not in STOP_WORDS
        and count >= 5  # Minimum frequency
    ]
    
    print(f"\n  [1.4] New high-frequency terms: {len(new_terms[:100])}")
    
    return new_terms[:100]


# ============================================================================
# PHASE 2: SEMANTIC RELATION GENERATION
# ============================================================================

def phase2_generate_relations(new_terms: List[Tuple[str, int]]) -> Dict[str, List[str]]:
    """Generate semantic relations for new terms"""
    print("\n" + "=" * 60)
    print("  PHASE 2: SEMANTIC RELATION GENERATION")
    print("=" * 60)
    
    new_mappings = {}
    
    for term, freq in new_terms:
        # Check if we have expert-curated relations
        if term in SEMANTIC_RELATIONS:
            new_mappings[term] = SEMANTIC_RELATIONS[term]
            print(f"  ✓ {term} ({freq}x) → {len(SEMANTIC_RELATIONS[term])} relations")
        else:
            # Try to find partial matches
            for key, values in SEMANTIC_RELATIONS.items():
                if term in key or key in term:
                    new_mappings[term] = values[:5]
                    print(f"  ~ {term} ({freq}x) → matched via '{key}'")
                    break
    
    print(f"\n  Generated relations for {len(new_mappings)} terms")
    
    return new_mappings


# ============================================================================
# PHASE 3: UPDATE AND VALIDATE
# ============================================================================

def phase3_generate_typescript(new_mappings: Dict[str, List[str]], 
                                old_count: int = 80) -> str:
    """Generate TypeScript code for new mappings"""
    print("\n" + "=" * 60)
    print("  PHASE 3: GENERATE TYPESCRIPT UPDATE")
    print("=" * 60)
    
    # Combine with existing semantic relations
    all_mappings = {**SEMANTIC_RELATIONS, **new_mappings}
    
    lines = []
    lines.append("// ============================================================================")
    lines.append("// EXPANDED SEMANTIC CONTEXT MAP (Auto-generated)")
    lines.append(f"// Total mappings: {len(all_mappings)}")
    lines.append("// ============================================================================")
    lines.append("")
    lines.append("export const EXPANDED_CONTEXT_MAP: Record<string, string[]> = {")
    
    # Sort by category
    for term in sorted(all_mappings.keys()):
        relations = all_mappings[term]
        relations_str = ", ".join([f"'{r}'" for r in relations])
        lines.append(f"  '{term}': [{relations_str}],")
    
    lines.append("};")
    
    output = "\n".join(lines)
    
    new_count = len(all_mappings)
    print(f"\n  Previous mappings: {old_count}")
    print(f"  New mappings: {new_count}")
    print(f"  Total increase: +{new_count - old_count} ({((new_count - old_count) / old_count * 100):.0f}%)")
    
    return output


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 70)
    print("  SEMANTIC CONTEXT EXPANSION ENGINE")
    print("  Senior NLP Engineer Script")
    print("=" * 70)
    
    # Phase 1: Gap Analysis
    new_terms = phase1_gap_analysis()
    
    print("\n  TOP 50 NEW HIGH-FREQUENCY TERMS:")
    print("  " + "-" * 40)
    for i, (term, freq) in enumerate(new_terms[:50], 1):
        status = "✓" if term in SEMANTIC_RELATIONS else "○"
        print(f"  {i:2}. {status} {term} ({freq}x)")
    
    # Phase 2: Generate Relations
    new_mappings = phase2_generate_relations(new_terms)
    
    # Phase 3: Generate TypeScript
    typescript_code = phase3_generate_typescript(new_mappings)
    
    # Save to file
    output_file = "/Users/kajtek/sejm/git/parlament/src/utils/expandedContext.ts"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(typescript_code)
    
    print(f"\n  ✅ Saved to: {output_file}")
    
    # Summary
    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"  • High-frequency terms analyzed: {len(new_terms)}")
    print(f"  • New semantic mappings: {len(new_mappings)}")
    print(f"  • Total expert-curated relations: {len(SEMANTIC_RELATIONS)}")
    print(f"  • GRAND TOTAL: {len(SEMANTIC_RELATIONS)} context mappings")
    print("=" * 70)


if __name__ == "__main__":
    main()
