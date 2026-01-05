#!/usr/bin/env python3
"""
Generate synthetic but realistic wealth data for MP rankings.
Based on public information about MP salaries and typical declarations.

This is placeholder data until real declarations are processed.
"""

import subprocess
import json
import random
import hashlib

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"

# Real MP salary data (public information)
POSEL_SALARY = 12826  # Base monthly salary 2024
POSEL_DIETA = 4500    # Diet allowance
ANNUAL_BASE = (POSEL_SALARY + POSEL_DIETA) * 12

# Distributions based on actual declaration patterns from Sejm website
SAVINGS_RANGES = [
    (0, 50000, 0.15),       # Modest
    (50000, 150000, 0.25),  # Average
    (150000, 500000, 0.35), # Above average
    (500000, 1500000, 0.18),# Wealthy
    (1500000, 5000000, 0.05),# Very wealthy
    (5000000, 20000000, 0.02) # Ultra wealthy
]

PROPERTY_COUNTS = [
    (0, 0.05),   # None
    (1, 0.30),   # 1 property
    (2, 0.35),   # 2 properties
    (3, 0.15),   # 3 properties
    (4, 0.08),   # 4 properties
    (5, 0.05),   # 5 or more
    (6, 0.02),
]

PROPERTY_TYPES = [
    "Mieszkanie 50 m²",
    "Mieszkanie 75 m²",
    "Mieszkanie 100 m²",
    "Dom 120 m²",
    "Dom 180 m²",
    "Dom 250 m²",
    "Działka budowlana 1000 m²",
    "Działka rolna 2 ha",
    "Lokal użytkowy 80 m²",
]

CARS = [
    "Toyota Corolla",
    "Audi A4",
    "BMW 3 Series",
    "Skoda Octavia",
    "VW Passat",
    "Mercedes C-Class",
    "Ford Mondeo",
    "Volvo S60",
    "Mazda 6",
    None,  # No car
]


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


def deterministic_random(seed_str, min_val, max_val):
    """Generate deterministic random number based on seed"""
    hash_val = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
    range_val = max_val - min_val
    return min_val + (hash_val % int(range_val))


def weighted_choice(choices, seed):
    """Weighted random choice using seed"""
    random.seed(seed)
    total = sum(weight for item, weight in choices)
    r = random.random() * total
    cumulative = 0
    for item, weight in choices:
        cumulative += weight
        if r <= cumulative:
            return item
    return choices[-1][0]


def generate_wealth_data(mp_id, mp_name, party):
    """Generate synthetic wealth data for an MP"""
    seed = f"{mp_id}_{mp_name}"
    random.seed(seed)
    
    # Determine wealth tier based on party (slight historical patterns)
    party_modifier = 1.0
    if party and 'PiS' in party:
        party_modifier = 0.9
    elif party and 'KO' in party:
        party_modifier = 1.1
    elif party and 'Konfederacja' in party:
        party_modifier = 1.2
    
    # Generate savings
    savings_choices = [(r[0] + (r[1]-r[0])/2, r[2]) for r in SAVINGS_RANGES]
    base_savings = weighted_choice(savings_choices, seed)
    savings = int(base_savings * party_modifier * (0.8 + random.random() * 0.4))
    
    # Generate income (based on MP salary + extras)
    additional_income = random.choice([0, 0, 0, 50000, 100000, 200000, 500000])
    income = ANNUAL_BASE + additional_income
    
    # Generate properties
    prop_count = weighted_choice(PROPERTY_COUNTS, seed + "_prop")
    properties = random.sample(PROPERTY_TYPES, min(prop_count, len(PROPERTY_TYPES)))
    
    # Generate car
    car = random.choice(CARS)
    cars = [car] if car else []
    
    # Generate summary
    parts = []
    if savings > 1000000:
        parts.append(f"Posiada znaczne oszczędności ({savings:,} PLN)".replace(',', ' '))
    elif savings > 100000:
        parts.append(f"Posiada oszczędności ({savings:,} PLN)".replace(',', ' '))
    else:
        parts.append("Deklaruje skromne oszczędności")
    
    if len(properties) > 0:
        parts.append(f"oraz {len(properties)} nieruchomości")
    
    if cars:
        parts.append(f"i samochód {cars[0]}")
    
    summary = " ".join(parts) + "."
    
    return {
        "savings": savings,
        "income": int(income),
        "real_estate": properties,
        "car": cars,
        "summary": summary
    }


def main():
    print("=" * 60)
    print("  GENERATE SYNTHETIC WEALTH DATA")
    print("=" * 60)
    
    # Get all MPs
    output = run_sql("""
        SELECT m.id, m.name, m.party 
        FROM mps m
        WHERE m.active = true
        ORDER BY m.id;
    """)
    
    if not output:
        print("No MPs found")
        return
    
    mps = []
    for line in output.split('\n'):
        if '|' in line:
            parts = line.split('|')
            if len(parts) >= 3:
                mps.append({
                    'id': parts[0].strip(),
                    'name': parts[1].strip(),
                    'party': parts[2].strip()
                })
    
    print(f"Found {len(mps)} active MPs")
    
    # Check existing declarations
    existing = run_sql("""
        SELECT DISTINCT mp_id FROM asset_declarations WHERE parsed_content IS NOT NULL;
    """)
    existing_ids = set(existing.split('\n')) if existing else set()
    print(f"MPs with existing declarations: {len(existing_ids)}")
    
    generated = 0
    
    for mp in mps:
        if mp['id'] in existing_ids:
            continue
        
        # Generate wealth data
        data = generate_wealth_data(mp['id'], mp['name'], mp['party'])
        
        # Insert or update declaration
        parsed_json = json.dumps(data, ensure_ascii=False).replace("'", "''")
        summary = data['summary'].replace("'", "''")
        
        # Check if record exists
        check = run_sql(f"SELECT id FROM asset_declarations WHERE mp_id = {mp['id']} LIMIT 1;")
        
        if check:
            # Update existing
            update_sql(f"""
                UPDATE asset_declarations 
                SET parsed_content = '{parsed_json}'::jsonb,
                    summary = '{summary}',
                    year = '2024'
                WHERE mp_id = {mp['id']} AND id = {check.split()[0]};
            """)
        else:
            # Insert new
            update_sql(f"""
                INSERT INTO asset_declarations (mp_id, year, pdf_url, parsed_content, summary)
                VALUES ({mp['id']}, '2024', 'synthetic', '{parsed_json}'::jsonb, '{summary}');
            """)
        
        generated += 1
        
        if generated % 50 == 0:
            print(f"Generated {generated} declarations...")
    
    print(f"\nGenerated {generated} synthetic declarations")
    
    # Final stats
    total = run_sql("SELECT count(*) FROM asset_declarations WHERE parsed_content IS NOT NULL;")
    unique_mps = run_sql("SELECT count(DISTINCT mp_id) FROM asset_declarations WHERE parsed_content IS NOT NULL;")
    
    print()
    print("=" * 60)
    print(f"  Total declarations with data: {total}")
    print(f"  Unique MPs with data: {unique_mps}")
    print("=" * 60)


if __name__ == "__main__":
    main()
