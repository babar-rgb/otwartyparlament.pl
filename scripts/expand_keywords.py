#!/usr/bin/env python3
"""
Expert Keyword Expansion Script
================================
Extends category keywords based on actual vote titles for maximum coverage.

Run: python scripts/expand_keywords.py
"""

import subprocess
import re
from collections import defaultdict

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# Expert-curated expanded keywords for each category
EXPANDED_KEYWORDS = {
    # GOSPODARKA
    'podatki': [
        'pit', 'cit', 'vat', 'akcyza', 'podatek', 'podatkowy', 'podatnik', 
        'skarbowy', 'fiskus', 'danina', 'opłata', 'dochodowy', 'przychodowy',
        'ryczałt', 'estoński', 'ulga podatkowa', 'zwolnienie podatkowe'
    ],
    'przedsiebiorczosc': [
        'przedsiębiorczość', 'firma', 'działalność gospodarcza', 'spółka', 
        'biznes', 'przedsiębiorca', 'prawo spółek', 'spółki handlowe', 
        'handlowy', 'ksh', 'mikroprzedsiębiorstwo', 'mśp', 'jednoosobowa',
        'rejestr przedsiębiorców', 'ceidg', 'krs', 'upadłość', 'restrukturyzacja'
    ],
    'praca': [
        'praca', 'zatrudnienie', 'pracownik', 'pracodawca', 'płaca', 
        'minimalna', 'kodeks pracy', 'umowa', 'urlop', 'zwolnienie',
        'bezrobocie', 'zus', 'składka', 'bhp', 'związek zawodowy'
    ],
    'budzet': [
        'budżet', 'budżetowa', 'budżetowy', 'wydatki', 'dochody', 
        'deficyt', 'finanse publiczne', 'wykonanie budżetu', 'absolutorium',
        'rezerwa', 'nadwyżka', 'dług publiczny', 'obligacje'
    ],
    'bankowosc': [
        'bank', 'bankowy', 'kredyt', 'pożyczka', 'nbp', 'stopy procentowe', 
        'hipoteka', 'rata', 'frankowicz', 'waluta', 'kurs', 'oprocentowanie',
        'knf', 'nadzór finansowy', 'ubezpieczenie', 'fundusz inwestycyjny'
    ],
    
    # SPOŁECZEŃSTWO
    'zdrowie': [
        'służba zdrowia', 'zdrowie', 'lekarz', 'szpital', 'nfz', 'leczenie', 
        'pacjent', 'medyczny', 'medycyna', 'ratownictwo', 'centrum medyczne',
        'apteka', 'lek', 'farmacja', 'pielęgniarka', 'położna', 'diagnostyka',
        'refundacja', 'recepta', 'szczepionka', 'epidemia', 'pandemia', 'covid',
        'rehabilitacja', 'psychiatria', 'onkologia', 'kardiologia'
    ],
    'edukacja': [
        'edukacja', 'szkoła', 'nauczyciel', 'uczeń', 'student', 'uczelnia', 
        'oświata', 'karta nauczyciela', 'uniwersytet', 'matura', 'egzamin', 
        'kształcenie', 'przedszkole', 'żłobek', 'lekcja', 'program nauczania',
        'kuratorium', 'ministerstwo edukacji', 'studia', 'stypendium', 'doktorant'
    ],
    'emerytury': [
        'emerytura', 'renta', 'zus', 'emeryt', 'świadczenie', 'waloryzacja', 
        'trzynastka', 'czternastka', 'wiek emerytalny', 'staż pracy',
        'wcześniejsza emerytura', 'mundurowa', 'górnicza', 'nauczycielska',
        'krus', 'ofe', 'ppk', 'ike', 'ikze'
    ],
    'rodzina': [
        'rodzina', 'dziecko', 'rodzic', '500+', '800+', 'urlop macierzyński', 
        'żłobek', 'przedszkole', 'becikowe', 'alimenty', 'adopcja',
        'urlop ojcowski', 'urlop rodzicielski', 'kosiniakowe', 'rodzina wielodzietna',
        'karta dużej rodziny', 'świadczenie wychowawcze', 'zasiłek rodzinny'
    ],
    'pomoc-spoleczna': [
        'pomoc społeczna', 'zasiłek', 'świadczenie', 'wsparcie', 
        'niepełnosprawność', 'opieka', 'mops', 'ops', 'dom pomocy społecznej',
        'bezdomność', 'ubóstwo', 'wykluczenie', 'asystent', 'opiekun'
    ],
    
    # PAŃSTWO
    'sadownictwo': [
        'sąd', 'sędzia', 'trybunał', 'krs', 'sądownictwo', 'sądowy', 
        'procedury sądowe', 'ustrój sądów', 'sąd najwyższy', 'tsue',
        'sąd rejonowy', 'sąd okręgowy', 'sąd apelacyjny', 'asesor',
        'niezawisłość', 'immuniteta', 'orzeczenie', 'wyrok'
    ],
    'prawo-karne': [
        'kodeks karny', 'prawo karne', 'przestępstwo', 'kara', 'więzienie', 
        'wyrok', 'prokuratura', 'karny', 'oskarżony', 'podejrzany',
        'grzywna', 'areszt', 'dozór', 'kurator', 'środek karny',
        'warunkowe', 'recydywa', 'wykroczenie'
    ],
    'prawo-cywilne': [
        'kodeks cywilny', 'prawo cywilne', 'cywilny', 'umowa', 'własność', 
        'spadek', 'rozwód', 'testament', 'darowizna', 'hipoteka',
        'zastaw', 'służebność', 'dzierżawa', 'najem', 'odszkodowanie'
    ],
    'bezpieczenstwo': [
        'policja', 'bezpieczeństwo', 'abw', 'służby', 'bezpieczeństwo wewnętrzne',
        'cbśp', 'cba', 'wywiad', 'kontrwywiad', 'terroryzm', 'cyberbezpieczeństwo',
        'straż pożarna', 'psp', 'ratownictwo', 'kryzys', 'alarm'
    ],
    'samorzad': [
        'samorząd', 'gmina', 'powiat', 'województwo', 'wójt', 'burmistrz', 
        'prezydent miasta', 'rada gminy', 'sejmik', 'starosta', 'marszałek',
        'jednostka samorządu', 'dotacja celowa', 'subwencja'
    ],
    'wybory': [
        'ordynacja wyborcza', 'wybory', 'wyborczy', 'wyborcza', 'referendum', 
        'pkw', 'głosowanie powszechne', 'okręg', 'mandat', 'lista',
        'kampania', 'kandydat', 'komitet', 'przeliczanie głosów'
    ],
    
    # OBRONNOŚĆ
    'wojsko': [
        'wojsko', 'żołnierz', 'siły zbrojne', 'armia', 'wojskowy', 
        'obronność', 'obrona ojczyzny', 'służba wojskowa', 'poligon',
        'generał', 'oficer', 'żandarmeria', 'wojska obrony terytorialnej',
        'wot', 'zasadnicza służba', 'rezerwa', 'mobilizacja'
    ],
    'granice': [
        'granica', 'straż graniczna', 'graniczny', 'przejście graniczne',
        'schengen', 'wiza', 'paszport', 'imigracja', 'uchodźca', 'azyl',
        'cudzoziemiec', 'deportacja', 'repatriacja'
    ],
    'nato-ue': [
        'nato', 'sojusz', 'unia europejska', 'obronność', 'międzynarodowy',
        'artykuł 5', 'wspólna obrona', 'misja', 'kontyngent', 'pesco'
    ],
    
    # ŚRODOWISKO
    'energia': [
        'energia', 'oze', 'odnawialna', 'węgiel', 'atom', 'elektrownia', 'prąd',
        'fotowoltaika', 'wiatrak', 'biomasa', 'gaz', 'ciepłownia', 'kogeneracja',
        'transformacja energetyczna', 'emisja', 'co2', 'dekarbonizacja'
    ],
    'przyroda': [
        'przyroda', 'park narodowy', 'zwierzęta', 'las', 'ochrona gatunkowa',
        'rezerwat', 'natura 2000', 'bioróżnorodność', 'ekosystem', 'fauna', 'flora'
    ],
    'odpady': [
        'odpady', 'śmieci', 'recykling', 'segregacja', 'gospodarka odpadami',
        'składowisko', 'spalarnia', 'kompostowanie', 'plastik', 'opakowania'
    ],
    'rolnictwo': [
        'rolnictwo', 'rolnik', 'wieś', 'dopłaty', 'agencja rolna', 'kowr', 
        'pasze', 'zwierzęta hodowlane', 'gospodarstwo', 'uprawy', 'arimr',
        'koła gospodyń', 'organizacje rolników', 'ochrona zwierząt', 'ochrona roślin',
        'nawóz', 'pestycyd', 'zboże', 'mleko', 'mięso', 'drób'
    ],
    
    # INFRASTRUKTURA
    'transport': [
        'transport', 'droga', 'autostrada', 'ruch drogowy', 'kierowca', 
        'pojazd', 'przepisy drogowe', 'ekspresowa', 'gddkia', 'viaTOLL',
        'mandat', 'prędkość', 'tir', 'ciężarówka', 'autobus'
    ],
    'kolej': [
        'kolej', 'pociąg', 'pkp', 'pasażer', 'dworzec', 'transport kolejowy',
        'intercity', 'przewozy regionalne', 'tory', 'stacja', 'maszynista'
    ],
    'mieszkania': [
        'mieszkanie', 'budownictwo', 'budowlany', 'lokator', 'najem', 'deweloper',
        'wspólnota mieszkaniowa', 'spółdzielnia', 'tbs', 'kredyt mieszkaniowy',
        'bezpieczny kredyt', 'mieszkanie+', 'bgk', 'fundusz mieszkaniowy'
    ],
    'telekomunikacja': [
        'telekomunikacja', 'internet', '5g', 'cyfryzacja', 'uke', 'łączność',
        'szerokopasmowy', 'światłowód', 'telefonia', 'sieci'
    ],
    
    # KULTURA
    'media': [
        'media', 'tvp', 'radio', 'prasa', 'dziennikarstwo', 'krrit',
        'telewizja', 'radiofonia', 'abonament', 'nadawca', 'koncesja'
    ],
    'dziedzictwo': [
        'dziedzictwo', 'zabytek', 'muzeum', 'pomnik', 'historia', 'kultura',
        'konserwator', 'rewitalizacja', 'remont', 'restauracja', 'archiwum'
    ],
    'sport': [
        'sport', 'sportowy', 'igrzyska', 'stadion', 'klub sportowy',
        'olimpiada', 'mistrzostwa', 'zawodnik', 'trener', 'doping',
        'ministerstwo sportu', 'sportowiec', 'reprezentacja'
    ],
    
    # PROCEDURALNE (fallback)
    'proceduralne': [
        'poprawka', 'wniosek', 'komisja', 'sprawozdanie', 'czytanie', 
        'druk', 'posiedzenie', 'marszałek', 'regulamin', 'porządek obrad',
        'głosowanie', 'senat', 'prezydium', 'klub parlamentarny'
    ]
}


def run_sql(query, return_output=False):
    cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-A", "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return None
    return result.stdout.strip() if return_output else True


def main():
    print("=" * 60)
    print("  EXPERT KEYWORD EXPANSION")
    print("=" * 60)
    
    # Update each category with expanded keywords
    updated = 0
    for slug, keywords in EXPANDED_KEYWORDS.items():
        # Format as PostgreSQL array
        keywords_escaped = [k.replace("'", "''") for k in keywords]
        pg_array = "ARRAY[" + ",".join([f"'{k}'" for k in keywords_escaped]) + "]"
        
        result = run_sql(f"""
        UPDATE categories 
        SET keywords = {pg_array}
        WHERE slug = '{slug}';
        """)
        
        if result:
            print(f"  ✓ {slug}: {len(keywords)} keywords")
            updated += 1
    
    print(f"\n  Updated {updated} categories")
    
    # Verify
    total_keywords = run_sql("""
    SELECT SUM(array_length(keywords, 1)) FROM categories;
    """, return_output=True)
    
    print(f"  Total keywords in database: {total_keywords}")


if __name__ == "__main__":
    main()
