#!/usr/bin/env python3
"""
Professional Title Simplifier for Sejm Votes
=============================================
Transforms long, legal vote titles into short, citizen-friendly headlines.

Features:
- Multi-pass cleaning with priority ordering
- Smart topic extraction
- Year/budget detection
- Quality validation
- Fallback strategies

Run: python scripts/simplify_titles_rules.py
"""

import re
import subprocess
from typing import Optional, Tuple

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# ============================================================================
# PHASE 1: STRIP PROCEDURAL WRAPPERS (ordered by priority)
# ============================================================================
PROCEDURAL_STRIPS = [
    # Point numbers
    r'^Pkt\.?\s*\d+[a-z]?\.\s*porz(?:ądku)?\.?\s*dz(?:ien(?:nego)?)?\.?\s*',
    r'^Punkt\s+\d+\s+porządku\s+dziennego[:\s]*',
    
    # Reading stages
    r'^(?:Pierwsze|Drugie|Trzecie)\s+czytanie\s+',
    r'\s*[-–—]\s*(?:pierwsze|drugie|trzecie)\s+czytanie$',
    
    # Committee reports
    r'^Sprawozdanie\s+Komisji\s+(?:Nadzwyczajnej\s+)?(?:do spraw\s+)?(?:\w+\s+)?o\s+',
    r'^Sprawozdanie\s+Komisji\s+w\s+sprawie\s+',
    
    # Senate response
    r'^[Uu]chwale\s+Senatu\s+w\s+sprawie\s+ustawy\s+o\s+',
    r'^[Uu]chwale\s+Senatu\s+w\s+sprawie\s+ustawy\s+',
    r'^[Uu]chwale\s+Senatu\s+w\s+sprawie\s+',
    r'^[Uu]stawy\s+(?:z\s+dnia\s+\d+\s+\w+\s+\d+\s+r\.\s+)?o\s+',
    
    # Motions and proposals
    r'^Wniosek\s+(?:o\s+|w\s+sprawie\s+)',
    r'^Odrzucenie\s+wniosku\s+(?:o\s+|w\s+sprawie\s+)',
    r'^Projekt\s+uchwały\s+w\s+sprawie\s+',
    r'^Głosowanie\s+(?:nad\s+|w\s+sprawie\s+)',
    
    # Bill types
    r'rządow(?:y|ym)\s+projekt(?:cie)?\s+ustawy\s+(?:o\s+)?',
    r'poselsk(?:i|im)\s+projekt(?:cie)?\s+ustawy\s+(?:o\s+)?',
    r'poselskich\s+projektach\s+ustaw\s+(?:o\s+)?',
    r'senack(?:i|im)\s+projekt(?:cie)?\s+ustawy\s+(?:o\s+)?',
    r'obywatelsk(?:i|im)\s+projekt(?:cie)?\s+ustawy\s+(?:o\s+)?',
    r'komisyjn(?:y|ym)\s+projekt(?:cie)?\s+ustawy\s+(?:o\s+)?',
    r'przedstawion(?:y|ym)\s+przez\s+Prezydenta\s+(?:RP\s+)?',
]

# ============================================================================
# PHASE 2: REMOVE LEGAL BOILERPLATE
# ============================================================================
BOILERPLATE_STRIPS = [
    # Amendment references
    r'zmianie\s+ustawy\s+(?:z\s+dnia\s+\d+\s+\w+\s+\d+\s+r\.\s+)?(?:[-–—]\s+)?(?:o\s+)?',
    r'oraz\s+(?:o\s+)?zmianie\s+(?:niektórych\s+)?(?:innych\s+)?ustaw',
    r'(?:oraz|i)\s+niektórych\s+innych\s+ustaw',
    
    # Print numbers
    r'\s*\(druki?\s+nr\s+[^)]+\)',
    r'\s*\(druk\s+[^)]+\)',
    
    # Date ranges
    r'\s+za\s+okres\s+od\s+\d+\s+\w+(?:\s+\d+\s+r\.)?\s+do\s+\d+\s+\w+\s+\d+\s+r\.',
    r'\s+z\s+dnia\s+\d+\s+\w+\s+\d+\s+r\.',
    
    # Absolutory clause
    r'\s+wraz\s+z\s+przedstawioną\s+przez\s+[^,]+(?:,|$)',
    r'\s+wraz\s+z\s+[^,]+\s+analizą\s+[^,]+(?:,|$)',
    r'\s+oraz\s+komisyjnym\s+projektem\s+uchwały\s+w\s+przedmiocie\s+absolutorium',
    r'\s+w\s+przedmiocie\s+absolutorium',
    
    # Text versions
    r'\s*[-–—]\s*tekst\s+jednolity',
]

# ============================================================================
# PHASE 3: SMART REPLACEMENTS (topic -> friendly name)
# ============================================================================
SMART_REPLACEMENTS = [
    # CODES -> Short names
    (r'Kodeks(?:u|ie)?\s+karny(?:m|ego)?(?:\s+wykonawczy(?:m|ego)?)?', 'Prawo karne'),
    (r'Kodeks(?:u|ie)?\s+cywilny(?:m|ego)?', 'Prawo cywilne'),
    (r'Kodeks(?:u|ie)?\s+pracy', 'Kodeks pracy'),
    (r'Kodeks(?:u|ie)?\s+postępowania\s+(?:karnego|cywilnego|administracyjnego)', 'Procedury sądowe'),
    (r'Kodeks(?:u|ie)?\s+spółek\s+handlowych', 'Prawo spółek'),
    (r'Kodeks(?:u|ie)?\s+wyborczy(?:m|ego)?', 'Ordynacja wyborcza'),
    
    # TAXES
    (r'podatk(?:u|iem)\s+dochodowy(?:m|ego)?\s+od\s+osób\s+fizycznych', 'PIT'),
    (r'podatk(?:u|iem)\s+dochodowy(?:m|ego)?\s+od\s+osób\s+prawnych', 'CIT'),
    (r'podatk(?:u|iem)\s+od\s+towarów\s+i\s+usług', 'VAT'),
    (r'podatk(?:u|iem)\s+akcyzowy(?:m|ego)?', 'Akcyza'),
    
    # HEALTH
    (r'świadczeni(?:ach|ami)\s+opieki\s+zdrowotnej(?:\s+finansowanych\s+ze\s+środków\s+publicznych)?', 'Służba zdrowia'),
    (r'działalności\s+leczniczej', 'Szpitale i przychodnie'),
    (r'zawod(?:zie|ach)\s+lekarza\s+i\s+lekarza\s+dentysty', 'Zawód lekarza'),
    (r'Państwowy(?:m|ego)?\s+Ratownictw(?:ie|a)\s+Medyczn(?:ym|ego)?', 'Ratownictwo medyczne'),
    
    # EDUCATION
    (r'system(?:ie|u)\s+oświaty', 'System edukacji'),
    (r'szkolnictw(?:ie|a)\s+wyższy(?:m|ego)?(?:\s+i\s+nauce)?', 'Uczelnie wyższe'),
    (r'Kart(?:cie|y|ą)\s+Nauczyciela', 'Karta Nauczyciela'),
    
    # SOCIAL
    (r'ubezpieczeni(?:ach|u)\s+społecznych', 'ZUS'),
    (r'emerytur(?:ach|y)\s+(?:i|oraz)\s+rent(?:ach|y)', 'Emerytury i renty'),
    (r'pomocy\s+społecznej', 'Pomoc społeczna'),
    (r'świadczeni(?:ach|u)\s+rodzinnych', 'Świadczenia rodzinne'),
    (r'wsparci(?:u|a)\s+kobiet\s+w\s+ciąży', 'Wsparcie dla kobiet w ciąży'),
    
    # ECONOMY
    (r'działalności\s+gospodarczej', 'Przedsiębiorczość'),
    (r'swobod(?:zie|y)\s+działalności\s+gospodarczej', 'Wolność gospodarcza'),
    (r'zamówieni(?:ach|a)\s+publicznych', 'Zamówienia publiczne'),
    (r'prawo?\s+bankow(?:e|ym|ego)', 'Prawo bankowe'),
    
    # DEFENSE & SECURITY
    (r'Sił(?:ach|y)?\s+Zbrojnych\s+(?:RP|Rzeczypospolitej\s+Polskiej)', 'Wojsko'),
    (r'obronie\s+Ojczyzny', 'Obronność'),
    (r'Policj(?:i|ą)', 'Policja'),
    (r'Straż(?:y|ą)?\s+Graniczn(?:ej|ą)', 'Straż Graniczna'),
    (r'Agencj(?:i|ą)\s+Bezpieczeństwa\s+Wewnętrznego', 'ABW'),
    
    # JUSTICE
    (r'Krajow(?:ej|ą)\s+Rad(?:zie|y|ą)\s+Sądownictwa', 'KRS'),
    (r'Sąd(?:zie|u|em)?\s+Najwyższy(?:m|ego)?', 'Sąd Najwyższy'),
    (r'Trybunał(?:e|u|em)?\s+Konstytucyjny(?:m|ego)?', 'Trybunał Konstytucyjny'),
    (r'Najwyższ(?:ą|ej)\s+Izb(?:ę|y|ą)\s+Kontroli', 'NIK'),
    (r'prokuratur(?:ze|y|ą)', 'Prokuratura'),
    
    # AGRICULTURE
    (r'kołach\s+gospodyń\s+wiejskich', 'Koła gospodyń wiejskich'),
    (r'organizacj(?:ach|i)\s+rolników', 'Związki rolników'),
    (r'pasz(?:ach|y)', 'Pasze dla zwierząt'),
    (r'ochronie\s+zwierząt', 'Ochrona zwierząt'),
    (r'ochronie\s+roślin', 'Ochrona roślin'),
    
    # ENVIRONMENT
    (r'ochronie\s+(?:i\s+kształtowaniu\s+)?środowiska', 'Ochrona środowiska'),
    (r'odnawialnych\s+źródł(?:ach|a)\s+energii', 'Energia odnawialna'),
    (r'gospodarce\s+odpadami', 'Gospodarka odpadami'),
    
    # TRANSPORT
    (r'prawi?e?\s+o\s+ruchu\s+drogowym', 'Przepisy drogowe'),
    (r'transporcie\s+drogowym', 'Transport drogowy'),
    (r'transporcie\s+kolejowym', 'Koleje'),
    
    # HOUSING
    (r'prawi?e?\s+budowlan(?:ym|ego|e)', 'Prawo budowlane'),
    (r'planowani(?:u|a)\s+i\s+zagospodarowani(?:u|a)\s+przestrzenn(?:ym|ego)', 'Planowanie przestrzenne'),
    (r'ochronie\s+praw\s+lokatora', 'Prawa lokatorów'),
    
    # LOCAL GOV
    (r'samorządzie\s+(?:gminnym|terytorialnym|powiatowym|województwa)', 'Samorząd'),
    (r'dochodach\s+jednostek\s+samorządu\s+terytorialnego', 'Finanse samorządów'),
    
    # ELECTIONS
    (r'wyborze\s+Prezydenta', 'Wybory prezydenckie'),
    (r'wyborach\s+do\s+Sejmu\s+i\s+Senatu', 'Wybory parlamentarne'),
    (r'referendum\s+(?:ogólnokrajowym|lokalnym)', 'Referendum'),
    
    # MISC
    (r'Rzeczypospolitej\s+Polskiej', 'RP'),
    (r'Rzeczpospolita\s+Polska', 'RP'),
]

# ============================================================================
# PHASE 4: BUDGET YEAR EXTRACTION
# ============================================================================
def extract_budget_year(title: str) -> Optional[str]:
    """Extract year from budget-related votes"""
    patterns = [
        r'budżet(?:ow(?:ej|a|y))?\s+(?:na\s+)?(?:rok\s+)?(\d{4})',
        r'na\s+rok\s+(\d{4})',
        r'na\s+(\d{4})\s+(?:r(?:ok)?\.?)',
        r'w\s+(\d{4})\s+r(?:oku)?\.?',
        r'za\s+(\d{4})\s+r(?:ok)?\.?',
    ]
    for p in patterns:
        m = re.search(p, title, re.IGNORECASE)
        if m:
            return m.group(1)
    return None


# ============================================================================
# MAIN SIMPLIFICATION FUNCTION
# ============================================================================
def simplify_title(original: str) -> Tuple[str, str]:
    """
    Transform legal title into citizen-friendly headline.
    Returns (short_title, method_used)
    """
    if not original or len(original) < 10:
        return (original or "", "skip")
    
    title = original
    
    # === PHASE 1: Strip procedural wrappers ===
    for pattern in PROCEDURAL_STRIPS:
        title = re.sub(pattern, '', title, flags=re.IGNORECASE)
    
    # === PHASE 2: Remove boilerplate ===
    for pattern in BOILERPLATE_STRIPS:
        title = re.sub(pattern, '', title, flags=re.IGNORECASE)
    
    # === PHASE 3: Smart replacements ===
    for pattern, replacement in SMART_REPLACEMENTS:
        title = re.sub(pattern, replacement, title, flags=re.IGNORECASE)
    
    # === PHASE 4: Budget detection ===
    year = extract_budget_year(original)
    if year and 'budżet' in original.lower():
        if 'wykonan' in original.lower():
            return (f"Wykonanie budżetu {year}", "budget")
        elif 'absolutorium' in original.lower():
            return (f"Absolutorium dla rządu za {year}", "budget")
        else:
            return (f"Budżet państwa {year}", "budget")
    
    # === PHASE 5: Cleanup ===
    title = title.strip()
    title = re.sub(r'\s+', ' ', title)
    title = re.sub(r'^[\s,\.\-–—:]+', '', title)
    title = re.sub(r'[\s,\.\-–—:]+$', '', title)
    title = re.sub(r'\(\s*\)', '', title)
    
    # Capitalize
    if title:
        title = title[0].upper() + title[1:] if len(title) > 1 else title.upper()
    
    # === PHASE 6: Length check ===
    if len(title) > 80:
        # Try to find natural break
        breaks = ['. ', ' - ', ' – ', ', ']
        for sep in breaks:
            idx = title[:80].rfind(sep)
            if idx > 25:
                title = title[:idx].strip()
                break
        else:
            # Word-boundary truncate
            title = title[:77].rsplit(' ', 1)[0] + '...'
    
    # === PHASE 7: Quality validation ===
    if not title or len(title) < 8:
        # Fallback: use first 60 chars of original
        title = original[:60].strip()
        if len(original) > 60:
            title = title.rsplit(' ', 1)[0] + '...'
        return (title, "fallback")
    
    return (title, "simplified")


# ============================================================================
# DATABASE FUNCTIONS
# ============================================================================
def run_sql(query, return_output=False):
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        return None
    return result.stdout.strip() if return_output else True


def get_votes(limit=2000):
    output = run_sql(f"""
    SELECT id, COALESCE(title_clean, title_raw) as title
    FROM votes 
    WHERE title_short IS NULL
    AND (title_clean IS NOT NULL OR title_raw IS NOT NULL)
    ORDER BY importance_score DESC NULLS LAST, id DESC
    LIMIT {limit};
    """, return_output=True)
    
    if not output:
        return []
    
    votes = []
    for line in output.split('\n'):
        if '|' in line:
            parts = line.split('|', 1)
            if len(parts) == 2 and parts[0].strip():
                votes.append({'id': int(parts[0]), 'title': parts[1]})
    return votes


def update_title(vote_id: int, short_title: str):
    safe = short_title.replace("'", "''")
    run_sql(f"UPDATE votes SET title_short = '{safe}' WHERE id = {vote_id};")


# ============================================================================
# MAIN
# ============================================================================
def main():
    print("=" * 70)
    print("  PROFESSIONAL TITLE SIMPLIFIER")
    print("  Transforms legal jargon → citizen-friendly headlines")
    print("=" * 70)
    
    current = run_sql("SELECT COUNT(*) FROM votes WHERE title_short IS NOT NULL;", return_output=True)
    total = run_sql("SELECT COUNT(*) FROM votes;", return_output=True)
    print(f"\nStatus: {current}/{total} processed\n")
    
    votes = get_votes(5000)
    if not votes:
        print("✅ All votes have short titles!")
        return
    
    print(f"Processing {len(votes)} votes...\n")
    
    stats = {'simplified': 0, 'budget': 0, 'fallback': 0, 'skip': 0}
    examples = []
    
    for i, v in enumerate(votes):
        short, method = simplify_title(v['title'])
        update_title(v['id'], short)
        stats[method] = stats.get(method, 0) + 1
        
        # Collect examples
        if len(examples) < 15 and method in ('simplified', 'budget'):
            examples.append((v['title'][:50], short))
        
        if (i + 1) % 500 == 0:
            print(f"  [{i+1}/{len(votes)}] simplified={stats['simplified']}, budget={stats['budget']}, fallback={stats['fallback']}")
    
    print("\n" + "=" * 70)
    print("  RESULTS")
    print("=" * 70)
    print(f"  ✓ Simplified:  {stats['simplified']}")
    print(f"  ✓ Budget:      {stats['budget']}")
    print(f"  ✓ Fallback:    {stats['fallback']}")
    print(f"  ✓ Skipped:     {stats['skip']}")
    
    final = run_sql("SELECT COUNT(*) FROM votes WHERE title_short IS NOT NULL;", return_output=True)
    print(f"\n  Total with title_short: {final}/{total}")
    
    if examples:
        print("\n" + "=" * 70)
        print("  EXAMPLES")
        print("=" * 70)
        for orig, short in examples[:10]:
            print(f"\n  PRZED: {orig}...")
            print(f"  PO:    {short}")


if __name__ == "__main__":
    main()
