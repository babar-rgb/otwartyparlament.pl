import psycopg2
import re
import os
import google.generativeai as genai
from etl_eu_logger import Logger
from dotenv import load_dotenv
import time

load_dotenv()

# CONFIG
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def clean_title(raw_title):
    if not raw_title: return ""
    # Remove "RC-B10-0528/2025 – " pattern
    # Regex: Start with RC-, then IDs, then " – "
    # Pattern: ^RC-[A-Z0-9-/]+ – 
    clean = re.sub(r'^RC-[A-Z0-9-/]+ – ', '', raw_title)
    return clean.strip()

def calculate_importance(votes_for, votes_against, votes_abstain, title):
    title_lower = title.lower()
    
    # 1. semantic Filters (DOWNGRADE)
    # Amendments, Paragraphs, Recitals are usually technical
    technical_terms = ["am ", "amendment", "§", "recital", "after", "before", "part"]
    if any(t in title_lower for t in technical_terms):
        return 0 # Never key vote
        
    # 2. Semantic Filters (UPGRADE)
    # Final votes, Resolutions as a whole
    high_value_terms = ["as a whole", "legislative resolution", "final vote", "provisional agreement"]
    
    base_score = 0
    total = votes_for + votes_against + votes_abstain
    if total < 100: return 0
    
    ratio = abs(votes_for - votes_against) / total
    base_score = int((1 - ratio) * 100)
    
    if any(t in title_lower for t in high_value_terms):
        base_score += 30 # Boost final votes
        
    # Cap
    return min(100, max(0, base_score))

import requests

def scrape_description_from_web(code):
    # Code format: B10-0522/2025
    # URL format: https://www.europarl.europa.eu/doceo/document/B-10-2025-0522_EN.html
    try:
        # Parse Code: B10-0522/2025 -> B-10-2025-0522
        parts = code.split('/') # [B10-0522, 2025]
        if len(parts) != 2: return None
        
        main_part = parts[0] # B10-0522
        year = parts[1] # 2025
        
        # B10-0522 -> B-10...
        # Assumes B10. What if RC?
        # Usually it is B-10-YYYY-NUM
        
        # Regex to be safe
        match = re.search(r'([A-Z]+)(\d+)-(\d+)', main_part)
        if not match: return None
        
        series = match.group(1) # B
        term = match.group(2) # 10
        number = match.group(3) # 0522
        
        doc_url_id = f"{series}-{term}-{year}-{number}"
        url = f"https://www.europarl.europa.eu/doceo/document/{doc_url_id}_EN.html"
        
        # Fetch
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code != 200: return None
        
        # Extract Title
        # Look for <meta property="og:title" content="...">
        # or <title>...</title>
        
        content = r.text
        
        # Try og:title
        m_og = re.search(r'<meta property="og:title"\s+content="([^"]+)"', content)
        if m_og: 
            return m_og.group(1).replace("&amp;", "&")
            
        # Try title tag
        m_title = re.search(r'<title>(.*?)</title>', content)
        if m_title:
            t = m_title.group(1).split('-')[0].strip()
            return t.replace("&amp;", "&")
            
        return None
        
    except Exception as e:
        Logger.warning("Web", f"Scrape failed for {code}: {e}")
        return None

def generate_ai_description(title, raw_title_for_code=""):
    # Priority 1: Gemini
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel('gemini-pro')
            prompt = f"Summarize this Europarliament vote title in 2 sentences (Polish language). Explain what it is about simply. Title: '{title}'"
            response = model.generate_content(prompt)
            return response.text.strip()
        except: pass
    
    # Priority 2: Scrape via Reference Code
    # Extract code from RAW title (RC-B10-0528/2025)
    # Regex: [A-Z]+[0-9]+-[0-9]+/[0-9]+
    code_match = re.search(r'([A-Z]+[0-9]+-[0-9]+/[0-9]+)', raw_title_for_code)
    if code_match:
        code = code_match.group(1)
        scraped = scrape_description_from_web(code)
        if scraped:
            # Translate to PL
            try:
                from deep_translator import GoogleTranslator
                translated = GoogleTranslator(source='auto', target='pl').translate(scraped)
                return f"{translated}"
            except Exception as e:
                Logger.warning("Translate", f"Failed: {e}")
                return scraped # Fallback to EN
            
    return None

def run_enrich():
    Logger.info("Enrich", "Starting Vote Enrichment...")
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Select votes that need processing
    # Filter where title starts with RC- OR description is NULL
    cur.execute("""
        SELECT id, title, votes_for, votes_against, votes_abstain, description 
        FROM euro_votes
        WHERE title LIKE 'RC-%' OR description IS NULL OR description = ''
        ORDER BY date DESC
    """)
    rows = cur.fetchall()
    Logger.info("Enrich", f"Found {len(rows)} votes to process.")
    
    updates = 0
    
    for row in rows:
        vid, title, vf, va, vab, desc = row
        clean = clean_title(title)
        
        score = calculate_importance(vf, va, vab, clean)
        is_key = score > 60
        
        new_desc = desc
        if not new_desc: # Scrape or AI
             # Logger.info("AI", f"Generating (or scraping) for: {clean[:30]}...")
             ai_text = generate_ai_description(clean, raw_title_for_code=title)
             if ai_text:
                 new_desc = ai_text
                 time.sleep(1) # Rate limit safety
        
        # Update
        cur.execute("""
            UPDATE euro_votes 
            SET title = %s, importance_score = %s, is_key_vote = %s, description = %s
            WHERE id = %s
        """, (clean, score, is_key, new_desc, vid))
        
        updates += 1
        if updates % 50 == 0:
            conn.commit()
            Logger.info("Enrich", f"Processed {updates}...")
            
    conn.commit()
    conn.close()
    Logger.success("Enrich", f"Finished. Updated {updates} votes.")

if __name__ == "__main__":
    run_enrich()
