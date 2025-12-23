import psycopg2
import json

DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def check_keyword(keyword, expected_phrase):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    print(f"Checking '{keyword}'...")
    # Search for votes containing the keyword in the title
    # We use the raw keyword for the query to maximize chance of finding relevant vote
    # e.g. 'węgl' matching 'węgla'
    cur.execute("SELECT v.title_clean, va.pros FROM vote_analyses va JOIN votes v ON va.vote_id = v.id WHERE v.title_clean ILIKE %s LIMIT 1", (f'%{keyword}%',))
    row = cur.fetchone()
    if row:
        title, pros_json = row
        pros = pros_json # JSONB is already decoded
        print(f"  Vote: {title[:50]}...")
        found = False
        for p in pros:
            # Check if expected phrase is in the arguments (fuzzy check ok)
            if expected_phrase in p:
                found = True
                print(f"  ✅ Found phrase: '{expected_phrase}'")
                break
        if not found:
             print(f"  ❌ Phrase '{expected_phrase}' NOT found. Pros: {pros}")
    else:
        print(f"  ⚠️ No vote found for keyword '{keyword}' in title.")
    conn.close()

if __name__ == "__main__":
    check_keyword("Ukrain", "Niepodległa Ukraina")
    check_keyword("inflac", "Walka z drożyzną")
    
    # Check 'węgl' (short stem to match 'o górnictwie węgla kamiennego')
    check_keyword("węgl", "Bezpieczeństwo energetyczne")
    
    # Check 'lasach' (Explicit match for "o lasach")
    check_keyword("lasach", "Bogactwo przyrodnicze")
