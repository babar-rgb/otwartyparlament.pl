#!/usr/bin/env python3
"""
Audyt danych rankingu majątkowego.
Sprawdza czy dane są poprawne i czy używane są najnowsze oświadczenia.
"""

import os
import json
from collections import Counter, defaultdict
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("VITE_SUPABASE_ANON_KEY")
)

def run_audit():
    print("=" * 60)
    print("AUDYT SEKCJI RANKING MAJĄTKOWY")
    print("=" * 60)
    print()

    # 1. Pobierz wszystkie oświadczenia
    print("1. STATYSTYKI OGÓLNE")
    print("-" * 40)

    declarations = supabase.table('asset_declarations').select('*').execute()
    total = len(declarations.data)
    print(f"   Łączna liczba oświadczeń: {total}")

    # Unikalni posłowie
    unique_mps = set(d['mp_id'] for d in declarations.data)
    print(f"   Unikalni posłowie z oświadczeniami: {len(unique_mps)}")

    # Oświadczenia z parsed_content
    with_parsed = [d for d in declarations.data if d.get('parsed_content')]
    print(f"   Oświadczenia z parsed_content: {len(with_parsed)}")

    # Rozkład lat
    years = Counter(d.get('year', 'BRAK') for d in declarations.data)
    print(f"   Rozkład lat: {dict(sorted(years.items()))}")

    print()
    print("2. ANALIZA WIELOKROTNYCH OŚWIADCZEŃ")
    print("-" * 40)

    # Grupuj po mp_id
    by_mp = defaultdict(list)
    for d in declarations.data:
        by_mp[d['mp_id']].append(d)

    # Posłowie z wieloma oświadczeniami
    multiple = {mp_id: decls for mp_id, decls in by_mp.items() if len(decls) > 1}
    print(f"   Posłowie z więcej niż 1 oświadczeniem: {len(multiple)}")

    if multiple:
        print()
        print("   PRZYKŁADY (pierwsze 10):")
        # Pobierz nazwy posłów
        mp_ids = list(multiple.keys())[:10]
        mps_data = supabase.table('mps').select('id, name').in_('id', mp_ids).execute()
        mp_names = {m['id']: m['name'] for m in mps_data.data}

        for mp_id in mp_ids:
            decls = multiple[mp_id]
            name = mp_names.get(mp_id, f"ID: {mp_id}")
            print(f"\n   {name}:")
            
            # Sortuj malejąco po roku
            sorted_decls = sorted(decls, key=lambda x: x.get('year', '0000'), reverse=True)
            
            for i, d in enumerate(sorted_decls):
                year = d.get('year', 'BRAK')
                pc = d.get('parsed_content', {})
                savings = pc.get('savings', 'N/A') if pc else 'N/A'
                income = pc.get('income', 'N/A') if pc else 'N/A'
                marker = "[NAJNOWSZE]" if i == 0 else "[STARSZE]"
                print(f"      {marker} Rok: {year} | Oszczędności: {savings} | Dochód: {income}")

    print()
    print("3. PROBLEM Z KODEM WealthRankings.tsx")
    print("-" * 40)
    print("""
   ZNALEZIONY BUG w linii 42:
   
   const decl = mp.asset_declarations?.[0];
   
   Ten kod pobiera PIERWSZY element tablicy, ale:
   - Supabase NIE gwarantuje kolejności bez ORDER BY
   - Może zwrócić STARSZE oświadczenie zamiast najnowszego
   
   ROZWIĄZANIE: Dodać sortowanie po roku w zapytaniu lub w kodzie:
   
   Opcja 1 (w Supabase query):
   .select('..., asset_declarations!inner(...)') + sortowanie server-side
   
   Opcja 2 (w kodzie):
   const sortedDecls = mp.asset_declarations?.sort((a, b) => 
       (b.year || '0').localeCompare(a.year || '0')
   );
   const decl = sortedDecls?.[0];
""")

    print()
    print("4. TEST: CZY DANE SĄ POPRAWNIE SORTOWANE?")
    print("-" * 40)

    # Symuluj co robi WealthRankings.tsx
    mps_with_decl = supabase.table('mps').select('''
        id,
        name,
        party,
        asset_declarations (
            parsed_content,
            summary,
            year
        )
    ''').execute()

    issues = []
    for mp in mps_with_decl.data:
        decls = mp.get('asset_declarations', [])
        if len(decls) > 1:
            # Sprawdź czy pierwsza deklaracja jest najnowsza
            first_year = decls[0].get('year', '0000') if decls else '0000'
            sorted_decls = sorted(decls, key=lambda x: x.get('year', '0000'), reverse=True)
            newest_year = sorted_decls[0].get('year', '0000')
            
            if first_year != newest_year:
                issues.append({
                    'name': mp['name'],
                    'używany_rok': first_year,
                    'najnowszy_rok': newest_year,
                    'wszystkie_lata': [d.get('year') for d in decls]
                })

    if issues:
        print(f"   ⚠️  ZNALEZIONO {len(issues)} POSŁÓW Z NIEPOPRAWNYM ROKIEM:")
        for issue in issues[:10]:
            print(f"      • {issue['name']}: używa {issue['używany_rok']}, powinien: {issue['najnowszy_rok']}")
            print(f"        Dostępne lata: {issue['wszystkie_lata']}")
    else:
        print("   ✓ Brak wykrytych problemów z kolejnością (może być przypadkowo OK)")

    print()
    print("5. SPRAWDZENIE JAKOŚCI DANYCH")
    print("-" * 40)

    # Sprawdź czy wartości liczbowe są sensowne
    savings_data = []
    income_data = []
    
    for d in with_parsed:
        pc = d.get('parsed_content', {})
        if pc:
            s = pc.get('savings')
            i = pc.get('income')
            if s and isinstance(s, (int, float)) and s > 0:
                savings_data.append(s)
            if i and isinstance(i, (int, float)) and i > 0:
                income_data.append(i)

    if savings_data:
        print(f"   Oszczędności:")
        print(f"      Min: {min(savings_data):,.0f} PLN")
        print(f"      Max: {max(savings_data):,.0f} PLN")
        print(f"      Średnia: {sum(savings_data)/len(savings_data):,.0f} PLN")
        print(f"      Liczba: {len(savings_data)}")

    if income_data:
        print(f"\n   Dochody:")
        print(f"      Min: {min(income_data):,.0f} PLN")
        print(f"      Max: {max(income_data):,.0f} PLN")
        print(f"      Średnia: {sum(income_data)/len(income_data):,.0f} PLN")
        print(f"      Liczba: {len(income_data)}")

    # Sprawdź podejrzane wartości
    suspicious = []
    for d in with_parsed:
        pc = d.get('parsed_content', {})
        if pc:
            s = pc.get('savings', 0)
            i = pc.get('income', 0)
            if isinstance(s, (int, float)) and s > 100_000_000:  # >100mln
                suspicious.append(f"Oszczędności {s:,.0f} PLN (mp_id: {d['mp_id']})")
            if isinstance(i, (int, float)) and i > 10_000_000:  # >10mln dochodu rocznie
                suspicious.append(f"Dochód {i:,.0f} PLN (mp_id: {d['mp_id']})")

    if suspicious:
        print(f"\n   ⚠️  PODEJRZANIE WYSOKIE WARTOŚCI:")
        for s in suspicious[:5]:
            print(f"      • {s}")

    print()
    print("=" * 60)
    print("REKOMENDACJE:")
    print("=" * 60)
    print("""
1. NAPRAW BUG w WealthRankings.tsx:
   Dodaj sortowanie po roku przed pobraniem pierwszego elementu.

2. Dodaj informację o roku oświadczenia w UI:
   Użytkownik powinien wiedzieć z jakiego roku są dane.

3. Rozważ cache/materialized view:
   Dla wydajności - przeliczaj rankingi periodycznie.

4. Dodaj walidację danych:
   Sprawdzaj czy parsed_content ma wymagane pola.
""")

if __name__ == "__main__":
    run_audit()
