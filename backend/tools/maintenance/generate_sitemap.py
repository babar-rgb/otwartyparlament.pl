
import os
import sys
from datetime import datetime

# Ensure we can import core modules
# Ensure we can import core modules
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from backend.core.db import db

BASE_URL = "https://otwartyparlament.pl"

static_pages = [
    "/", "/poslowie", "/partie", "/glosowania", "/rankingi", 
    "/majatek", "/wypowiedzi", "/interpelacje", "/projekty", 
    "/kategorie", "/metodologia", "/kontakt", "/porownywarka", "/o-projekcie"
]

def generate_sitemap():
    urls = []

    # 1. Static Pages
    for path in static_pages:
        urls.append({
            "loc": f"{BASE_URL}{path}",
            "changefreq": "daily",
            "priority": "0.8" if path == "/" else "0.7"
        })

    try:
        with db.get_cursor() as cur:
            # 2. MPs /poslowie/:id
            cur.execute("SELECT id FROM mps WHERE active=true")
            for row in cur.fetchall():
                urls.append({
                    "loc": f"{BASE_URL}/poslowie/{row['id']}",
                    "changefreq": "weekly",
                    "priority": "0.6"
                })

            # 3. Parties /partie/:id
            cur.execute("SELECT DISTINCT party FROM mps WHERE active=true")
            for row in cur.fetchall():
                if row['party']:
                    urls.append({
                        "loc": f"{BASE_URL}/partie/{row['party']}",
                        "changefreq": "weekly",
                        "priority": "0.6"
                    })

            # 4. Votes /glosowania/:term/:sitting/:voting_number
            cur.execute("SELECT term, sitting, voting_number, date FROM votes ORDER BY date DESC")
            votes = cur.fetchall()
            
            for row in votes:
                # RealDictCursor access
                term = row['term']
                sitting = row['sitting']
                voting_number = row['voting_number']
                date = row['date']
                
                date_str = date.strftime("%Y-%m-%d") if date else ""
                urls.append({
                    "loc": f"{BASE_URL}/glosowania/{term}/{sitting}/{voting_number}",
                    "changefreq": "monthly",
                    "priority": "0.5",
                    "lastmod": date_str
                })
    except Exception as e:
        sys.stderr.write(f"Error generating sitemap: {e}\n")
        # Continue with what we have or exit? 
        # Ideally exit with error, but let's just print to stderr
        pass

    # Write XML to STDOUT
    print('<?xml version="1.0" encoding="UTF-8"?>')
    print('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    for url in urls:
        print('  <url>')
        print(f'    <loc>{url["loc"]}</loc>')
        if url.get("lastmod"):
            print(f'    <lastmod>{url["lastmod"]}</lastmod>')
        print(f'    <changefreq>{url["changefreq"]}</changefreq>')
        print(f'    <priority>{url["priority"]}</priority>')
        print('  </url>')
        
    print('</urlset>')

if __name__ == "__main__":
    generate_sitemap()
