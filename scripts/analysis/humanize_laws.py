#!/usr/bin/env python3
"""
Law Humanizer for otwartyparlament.pl
Generates TL;DR summaries for legal texts.

FILAR 3: "Księga Praw" - Make laws understandable for everyone.

Run: python scripts/humanize_laws.py
"""

import subprocess
import json
import re

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"


def run_sql(query, return_output=False):
    """Execute SQL"""
    if return_output:
        cmd = [PSQL, "-U", DB_USER, "-d", DB, "-t", "-c", query]
    else:
        cmd = [PSQL, "-U", DB_USER, "-d", DB, "-c", query]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr[:200]}")
        return None
    return result.stdout.strip() if return_output else True


def get_processes_without_summary():
    """Get processes that need summaries (including those with short/no description)"""
    output = run_sql("""
    SELECT id, title, COALESCE(description, ''), category
    FROM processes;
    """, return_output=True)
    
    if not output:
        return []
    
    processes = []
    for line in output.split('\n'):
        if '|' in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 4:
                processes.append({
                    'id': parts[0],
                    'title': parts[1],
                    'description': parts[2],
                    'category': parts[3]
                })
    return processes


def generate_simple_summary(title, description, category):
    """
    Generate a human-readable summary based on title and description.
    Uses rule-based analysis (can be upgraded to AI later).
    """
    title_lower = title.lower() if title else ""
    desc_lower = description.lower() if description else ""
    combined = f"{title_lower} {desc_lower}"
    
    # Detect what changes
    what_changes = "Zmiana przepisów prawnych"
    
    if "zmiana ustawy" in combined:
        what_changes = "Nowelizacja istniejącej ustawy"
    elif "o zmianie" in combined:
        what_changes = "Modyfikacja obowiązującego prawa"
    elif "projekt ustawy" in combined:
        what_changes = "Nowe przepisy prawne"
    elif "ratyfikac" in combined:
        what_changes = "Ratyfikacja umowy międzynarodowej"
    elif "uchwała" in combined:
        what_changes = "Uchwała Sejmu (nie jest ustawą)"
    
    # Detect who is affected
    who_affected = []
    
    affected_mapping = {
        "emeryt": "Emeryci i renciści",
        "zus": "Ubezpieczeni w ZUS",
        "krus": "Rolnicy",
        "rolnik": "Rolnicy",
        "rolnic": "Rolnicy",
        "gospodarstw": "Rolnicy",
        "student": "Studenci",
        "uczelni": "Studenci i naukowcy",
        "szkoł": "Uczniowie i nauczyciele",
        "nauczy": "Nauczyciele",
        "lekar": "Lekarze",
        "pielęgni": "Pielęgniarki",
        "pacjent": "Pacjenci",
        "nfz": "Pacjenci",
        "szpital": "Pacjenci i szpitale",
        "zdrow": "Pacjenci i służba zdrowia",
        "farmaceu": "Farmaceuci",
        "lekami": "Pacjenci",
        "leków": "Pacjenci",
        "podatk": "Podatnicy",
        "pit": "Podatnicy",
        "cit": "Firmy",
        "vat": "Przedsiębiorcy",
        "akcyz": "Konsumenci",
        "przedsiębior": "Przedsiębiorcy",
        "gospodarcz": "Przedsiębiorcy",
        "firm": "Firmy",
        "biznes": "Firmy",
        "praco": "Pracownicy",
        "pracodaw": "Pracodawcy",
        "rent": "Renciści",
        "niepeł": "Osoby niepełnosprawne",
        "senior": "Seniorzy",
        "rodzin": "Rodziny",
        "dziec": "Rodzice i dzieci",
        "wychow": "Rodzice i dzieci",
        "wojsk": "Żołnierze",
        "żołnierz": "Żołnierze",
        "obron": "Siły Zbrojne RP",
        "policj": "Policjanci",
        "straż": "Służby mundurowe",
        "służb": "Służby mundurowe",
        "górni": "Górnicy",
        "kierow": "Kierowcy",
        "drog": "Kierowcy",
        "transport": "Firmy transportowe",
        "pasażer": "Pasażerowie",
        "kolej": "Pasażerowie kolei",
        "komunal": "Mieszkańcy miast",
        "gmina": "Samorządy",
        "samorząd": "Samorządy",
        "wójt": "Samorządy",
        "powiat": "Samorządy",
        "wojewódz": "Samorządy",
        "wybor": "Wyborcy",
        "głosow": "Wyborcy",
        "kobi": "Kobiety",
        "cudzoziem": "Cudzoziemcy",
        "uchodź": "Uchodźcy",
        "konsument": "Konsumenci",
        "bank": "Klienci banków",
        "kredyt": "Kredytobiorcy",
        "energi": "Odbiorcy energii",
        "prąd": "Odbiorcy energii",
        "ciepł": "Odbiorcy ciepła",
        "gaz": "Odbiorcy gazu",
        "klimat": "Wszyscy obywatele",
        "środowisk": "Wszyscy obywatele",
        "odpad": "Mieszkańcy",
        "cyber": "Użytkownicy internetu",
        "cyfr": "Użytkownicy systemów cyfrowych",
        "internet": "Internauci",
        "danych osob": "Administratorzy danych",
        "rodo": "Administratorzy danych",
        "sąd": "Strony postępowań sądowych",
        "prokura": "Prokuratorzy",
        "sędzi": "Sędziowie",
        "budownict": "Inwestorzy budowlani",
        "mieszkań": "Nabywcy mieszkań",
        "lokator": "Lokatorzy",
    }
    
    for keyword, group in affected_mapping.items():
        # Use Regex to match start of word (avoid 'lek' in 'elektrownia')
        # matches: " lek...", "Nature-lek...", "Startlek..."
        if re.search(r'(^|\W)' + re.escape(keyword), combined) and group not in who_affected:
            who_affected.append(group)
    
    # Category based defaults (if no specific group found OR to augment)
    if "OBRONNOŚĆ" in category:
        if "Siły Zbrojne RP" not in who_affected: who_affected.append("Siły Zbrojne RP")
        if "Wszyscy obywatele" not in who_affected: who_affected.append("Wszyscy obywatele")
    elif "ZDROWIE" in category and not who_affected:
        who_affected.extend(["Pacjenci", "Służba zdrowia"])
    elif "EDUKACJA" in category and not who_affected:
        who_affected.extend(["Uczniowie", "Nauczyciele"])
    elif "ROLNICTWO" in category and not who_affected:
        who_affected.append("Rolnicy")
    elif "GOSPODARKA" in category and not who_affected:
        who_affected.append("Przedsiębiorcy")
    elif "ENERGETYKA" in category and not who_affected:
        who_affected.extend(["Odbiorcy energii", "Przemysł"])
    elif "INFRASTRUKTURA" in category and not who_affected:
        who_affected.append("Podróżni i Kierowcy")
    elif "CYFRYZACJA" in category or "cyber" in combined:
        if "Użytkownicy systemów cyfrowych" not in who_affected: who_affected.insert(0, "Instytucje i Firmy (Cyberbezpieczeństwo)")

    # Deduplicate
    who_affected = list(dict.fromkeys(who_affected))
    
    if not who_affected:
        who_affected = ["Różne grupy obywateli"]
    
    # Generate pros/cons based on category
    pros = []
    cons = []
    
    if category == "ZDROWIE":
        pros.append("Poprawa dostępu do opieki zdrowotnej")
        cons.append("Możliwe obciążenie budżetu NFZ")
    elif category == "GOSPODARKA":
        pros.append("Wsparcie dla przedsiębiorczości")
        cons.append("Możliwy wzrost biurokracji")
    elif category == "ROLNICTWO":
        pros.append("Wsparcie dla rolników")
        cons.append("Konieczność dostosowania do nowych przepisów")
    elif category == "EDUKACJA":
        pros.append("Reforma systemu edukacji")
        cons.append("Okres przejściowy może być trudny")
    elif category == "SPRAWIEDLIWOŚĆ":
        pros.append("Usprawnienie wymiaru sprawiedliwości")
        cons.append("Kontrowersje wokół niezależności sądów")
    elif category == "OBRONNOŚĆ":
        pros.append("Wzmocnienie bezpieczeństwa narodowego")
        cons.append("Wysokie koszty dla budżetu")
    else:
        pros.append("Regulacja danego obszaru")
        cons.append("Konieczność adaptacji do nowych przepisów")
    
    return {
        "what_changes": what_changes,
        "who_affected": who_affected[:3],  # Max 3 groups
        "pros": pros,
        "cons": cons,
        "tldr": f"{what_changes}. Dotyczy: {', '.join(who_affected[:2])}."
    }


def update_process_summaries():
    """Generate and save summaries for processes"""
    print("Generating TL;DR summaries for legal processes...")
    
    processes = get_processes_without_summary()
    print(f"Found {len(processes)} processes without summaries")
    
    updated = 0
    for proc in processes:
        summary = generate_simple_summary(
            proc['title'], 
            proc['description'], 
            proc['category']
        )
        
        # Escape JSON for SQL
        summary_json = json.dumps(summary, ensure_ascii=False).replace("'", "''")
        who_array = "ARRAY[" + ",".join(f"'{w}'" for w in summary['who_affected']) + "]"
        
        query = f"""
        UPDATE processes 
        SET simple_summary = '{summary_json}'::jsonb,
            who_affected = {who_array}
        WHERE id = '{proc['id']}';
        """
        
        if run_sql(query):
            updated += 1
    
    print(f"✅ Updated {updated} processes with TL;DR summaries")


def update_vote_analyses_tldr():
    """Add TL;DR to vote analyses based on category"""
    print("Updating vote analyses with TL;DR format...")
    
    # First ensure ux_category is set on votes
    run_sql("""
    UPDATE votes SET ux_category = 
        CASE 
            WHEN category = 'ZDROWIE' THEN '🏥 Zdrowie i NFZ'
            WHEN category = 'GOSPODARKA' THEN '💰 Podatki i Ekonomia'
            WHEN category = 'ROLNICTWO' THEN '🚜 Rolnictwo i Środowisko'
            WHEN category = 'EDUKACJA' THEN '🎓 Edukacja i Nauka'
            WHEN category = 'SPRAWIEDLIWOŚĆ' THEN '⚖️ Prawo i Sprawiedliwość'
            WHEN category = 'OBRONNOŚĆ' THEN '🛡️ Bezpieczeństwo'
            WHEN category = 'ENERGETYKA' THEN '⚡ Energia i Klimat'
            WHEN category = 'POLITYKA SPOŁECZNA' THEN '🏠 Społeczeństwo'
            WHEN category = 'SPRAWY ZAGRANICZNE' THEN '🌍 Sprawy Zagraniczne'
            WHEN category = 'KULTURA' THEN '🎭 Kultura'
            WHEN category = 'INFRASTRUKTURA' THEN '🛤️ Infrastruktura'
            WHEN category IN ('PERSONALNE/PROCEDURALNE', 'SYMBOLICZNE') THEN '📜 Procedury Sejmowe'
            ELSE '📋 Inne Sprawy'
        END
    WHERE ux_category IS NULL;
    """)
    
    print("✅ UX categories applied to votes")


def show_sample_summaries():
    """Show sample of generated summaries"""
    print("\n📖 SAMPLE TL;DR SUMMARIES:")
    print("-" * 70)
    
    output = run_sql("""
    SELECT 
        substring(title, 1, 40) as title,
        simple_summary->>'tldr' as tldr,
        who_affected[1] as who
    FROM processes 
    WHERE simple_summary IS NOT NULL
    LIMIT 5;
    """, return_output=True)
    
    if output:
        print(output)


def main():
    print("="*60)
    print("  LAW HUMANIZER - TL;DR Generator")
    print("="*60)
    
    update_process_summaries()
    update_vote_analyses_tldr()
    show_sample_summaries()
    
    # Stats
    print("\n📈 SUMMARY STATS:")
    output = run_sql("""
    SELECT 
        'Processes with TL;DR' as metric,
        count(*) as count
    FROM processes 
    WHERE simple_summary IS NOT NULL
    UNION ALL
    SELECT 
        'Votes with UX Category',
        count(*)
    FROM votes 
    WHERE ux_category IS NOT NULL;
    """, return_output=True)
    print(output)


if __name__ == "__main__":
    main()
