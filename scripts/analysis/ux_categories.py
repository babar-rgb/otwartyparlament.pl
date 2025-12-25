#!/usr/bin/env python3
"""
UX Categories Mapper for otwartyparlament.pl
Maps internal categories to user-friendly UX categories with emojis.

Run: python scripts/ux_categories.py
"""

import subprocess
import json

PSQL = "/opt/homebrew/opt/postgresql@17/bin/psql"
DB = "otwarty_parlament"
DB_USER = "kajtek"

# UX Category Mapping: Internal -> User-Friendly
UX_CATEGORIES = {
    # 🚜 Rolnictwo i Środowisko
    "ROLNICTWO": {"ux": "🚜 Rolnictwo i Środowisko", "who": ["Rolnicy", "Właściciele ziemi", "Przedsiębiorcy rolni"]},
    "ŚRODOWISKO": {"ux": "🚜 Rolnictwo i Środowisko", "who": ["Ekologowie", "Mieszkańcy miast", "Przedsiębiorcy"]},
    
    # 🏥 Zdrowie i NFZ
    "ZDROWIE": {"ux": "🏥 Zdrowie i NFZ", "who": ["Pacjenci", "Lekarze", "Pielęgniarki", "Emeryci"]},
    
    # 💰 Podatki i Ekonomia
    "GOSPODARKA": {"ux": "💰 Podatki i Ekonomia", "who": ["Przedsiębiorcy", "Podatnicy", "Pracownicy"]},
    "EKONOMIA": {"ux": "💰 Podatki i Ekonomia", "who": ["Przedsiębiorcy", "Podatnicy", "Inwestorzy"]},
    
    # 🛡️ Bezpieczeństwo
    "OBRONNOŚĆ": {"ux": "🛡️ Bezpieczeństwo", "who": ["Żołnierze", "Służby mundurowe", "Wszyscy obywatele"]},
    "BEZPIECZEŃSTWO": {"ux": "🛡️ Bezpieczeństwo", "who": ["Wszyscy obywatele"]},
    
    # ⚖️ Prawo i Sprawiedliwość
    "SPRAWIEDLIWOŚĆ": {"ux": "⚖️ Prawo i Sprawiedliwość", "who": ["Sędziowie", "Prawnicy", "Obywatele"]},
    "PRAWNE": {"ux": "⚖️ Prawo i Sprawiedliwość", "who": ["Prawnicy", "Przedsiębiorcy"]},
    
    # 🎓 Edukacja i Nauka
    "EDUKACJA": {"ux": "🎓 Edukacja i Nauka", "who": ["Uczniowie", "Rodzice", "Nauczyciele", "Studenci"]},
    
    # ⚡ Energia i Klimat
    "ENERGETYKA": {"ux": "⚡ Energia i Klimat", "who": ["Konsumenci energii", "Przedsiębiorcy", "Górnictwo"]},
    
    # 🏠 Społeczeństwo
    "POLITYKA SPOŁECZNA": {"ux": "🏠 Społeczeństwo", "who": ["Rodziny", "Seniorzy", "Osoby niepełnosprawne"]},
    
    # 🌍 Sprawy Zagraniczne
    "SPRAWY ZAGRANICZNE": {"ux": "🌍 Sprawy Zagraniczne", "who": ["Dyplomaci", "Eksporterzy", "Imigranci"]},
    
    # 🎭 Kultura
    "KULTURA": {"ux": "🎭 Kultura", "who": ["Artyści", "Instytucje kultury"]},
    
    # 🛤️ Infrastruktura
    "INFRASTRUKTURA": {"ux": "🛤️ Infrastruktura", "who": ["Kierowcy", "Podróżni", "Gminy"]},
    
    # 📜 Procedury (low interest)
    "PERSONALNE/PROCEDURALNE": {"ux": "📜 Procedury Sejmowe", "who": ["Posłowie"]},
    "SYMBOLICZNE": {"ux": "📜 Procedury Sejmowe", "who": ["Wszyscy"]},
    
    # ❓ Inne
    "INNE": {"ux": "📋 Inne Sprawy", "who": ["Różne grupy"]},
}

# User-friendly categories for filtering
UX_FILTER_CATEGORIES = [
    {"key": "rolnictwo", "label": "🚜 Rolnictwo", "db_match": "Rolnictwo i Środowisko"},
    {"key": "zdrowie", "label": "🏥 Zdrowie", "db_match": "Zdrowie i NFZ"},
    {"key": "podatki", "label": "💰 Podatki", "db_match": "Podatki i Ekonomia"},
    {"key": "bezpieczenstwo", "label": "🛡️ Bezpieczeństwo", "db_match": "Bezpieczeństwo"},
    {"key": "prawo", "label": "⚖️ Prawo", "db_match": "Prawo i Sprawiedliwość"},
    {"key": "edukacja", "label": "🎓 Edukacja", "db_match": "Edukacja i Nauka"},
    {"key": "energia", "label": "⚡ Energia", "db_match": "Energia i Klimat"},
    {"key": "spoleczenstwo", "label": "🏠 Społeczeństwo", "db_match": "Społeczeństwo"},
]


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


def calculate_controversy_score(yes, no, abstain=0):
    """
    Calculate controversy score (0-100).
    Higher = more controversial (closer vote).
    """
    total = yes + no
    if total == 0:
        return 0
    
    diff = abs(yes - no)
    
    # Close votes = high controversy
    if diff < 10:
        return 100
    elif diff < 30:
        return 80
    elif diff < 50:
        return 60
    elif diff < 100:
        return 40
    else:
        return max(0, 100 - diff)


def update_ux_categories():
    """Update UX categories for all votes"""
    print("Updating UX categories for votes...")
    
    for internal_cat, ux_data in UX_CATEGORIES.items():
        ux_cat = ux_data["ux"]
        who = ux_data["who"]
        
        # Escape for SQL
        ux_cat_escaped = ux_cat.replace("'", "''")
        
        query = f"""
        UPDATE votes 
        SET ux_category = '{ux_cat_escaped}'
        WHERE category = '{internal_cat}' 
        AND (ux_category IS NULL OR ux_category != '{ux_cat_escaped}');
        """
        run_sql(query)
    
    print("✅ UX categories updated")


def update_controversy_scores():
    """Calculate controversy scores for all votes"""
    print("Calculating controversy scores...")
    
    query = """
    UPDATE votes 
    SET controversy_score = 
        CASE 
            WHEN ABS((details_json->>'yes')::int - (details_json->>'no')::int) < 10 THEN 100
            WHEN ABS((details_json->>'yes')::int - (details_json->>'no')::int) < 30 THEN 80
            WHEN ABS((details_json->>'yes')::int - (details_json->>'no')::int) < 50 THEN 60
            WHEN ABS((details_json->>'yes')::int - (details_json->>'no')::int) < 100 THEN 40
            ELSE GREATEST(0, 100 - ABS((details_json->>'yes')::int - (details_json->>'no')::int))
        END
    WHERE details_json IS NOT NULL
    AND details_json->>'yes' IS NOT NULL
    AND controversy_score IS NULL;
    """
    run_sql(query)
    
    print("✅ Controversy scores calculated")


def recalibrate_importance():
    """
    Recalibrate importance scores.
    Current distribution is too flat - only 17 votes are HIGH.
    We need ~5-10% to be HIGH for meaningful highlights.
    """
    print("Recalibrating importance scores...")
    
    # Boost high-controversy votes
    query = """
    UPDATE votes 
    SET importance_score = LEAST(100, importance_score + 30)
    WHERE controversy_score >= 80
    AND importance_score < 80;
    """
    run_sql(query)
    
    # Boost votes with specific keywords
    high_impact_keywords = [
        'podatek', 'vat', 'akcyza', 'budżet', 'aborcj', 'konstytucj',
        'trybunał', 'sąd najwyższy', 'obronnoś', 'wojsk', 'emeryt',
        'zus', 'krus', 'in vitro', 'ustawa budżetowa', 'ukraina', 
        'pis', 'nft', 'inflac', 'cen', 'prąd', 'gaz', '500+', '800+'
    ]
    
    for keyword in high_impact_keywords:
        query = f"""
        UPDATE votes 
        SET importance_score = LEAST(100, importance_score + 20)
        WHERE lower(title_clean) LIKE '%{keyword}%'
        AND importance_score < 80;
        """
        run_sql(query)
    
    print("✅ Importance scores recalibrated")


def show_highlights_preview():
    """Show preview of what highlights would return"""
    print("\n📊 HIGHLIGHTS PREVIEW (Top 10 this week):")
    print("-" * 70)
    
    output = run_sql("""
    SELECT 
        title_clean,
        ux_category,
        importance_score,
        controversy_score,
        date::date
    FROM votes 
    WHERE importance_score >= 70
    AND date > NOW() - INTERVAL '7 days'
    ORDER BY importance_score DESC, controversy_score DESC
    LIMIT 10;
    """, return_output=True)
    
    if output:
        print(output)
    else:
        print("No highlights found for this week. Showing all-time top:")
        output = run_sql("""
        SELECT 
            substring(title_clean, 1, 50) as title,
            ux_category,
            importance_score,
            controversy_score
        FROM votes 
        ORDER BY importance_score DESC, controversy_score DESC NULLS LAST
        LIMIT 10;
        """, return_output=True)
        print(output)


def main():
    print("="*60)
    print("  UX CATEGORIES & CONTROVERSY MAPPING")
    print("="*60)
    
    update_ux_categories()
    update_controversy_scores()
    recalibrate_importance()
    show_highlights_preview()
    
    # Stats
    print("\n📈 STATS:")
    output = run_sql("""
    SELECT 
        ux_category,
        count(*) as votes,
        round(avg(importance_score)) as avg_importance
    FROM votes 
    WHERE ux_category IS NOT NULL
    GROUP BY ux_category
    ORDER BY votes DESC;
    """, return_output=True)
    print(output)


if __name__ == "__main__":
    main()
