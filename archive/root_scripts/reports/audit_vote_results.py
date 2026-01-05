import psycopg2
from collections import Counter
import sys

# DB Config
DB_CONFIG = {
    "dbname": "otwarty_parlament",
    "user": "kajtek",
    "password": "",
    "host": "localhost",
    "port": 5432
}

def analyze_vote_coverage():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("🔍 Rozpoczynam audyt pokrycia wyników głosowań dla Sejmu...")

        # 1. Get stats on vote_results per vote
        # This query counts how many results exist for each vote_id
        query = """
        SELECT 
            v.id,
            v.title_clean,
            v.date,
            v.sitting,
            v.voting_number,
            COUNT(vr.id) as results_count
        FROM votes v
        LEFT JOIN vote_results vr ON v.id = vr.vote_id
        GROUP BY v.id
        ORDER BY v.date DESC, v.voting_number DESC;
        """
        
        cur.execute(query)
        rows = cur.fetchall()
        
        total_votes = len(rows)
        zero_results = 0
        partial_results = 0 # Less than 400 (arbitrary threshold for "suspiciously low" but not zero)
        full_results = 0    # >= 400 (Sejm usually has 460 MPs, attendance varies)

        suspicious_list = []

        for r in rows:
            vote_id, title, date, sitting, vote_number, count = r
            
            if count == 0:
                zero_results += 1
                suspicious_list.append({
                    "id": vote_id,
                    "sitting": sitting,
                    "vote_curr": vote_number,
                    "date": date,
                    "title": title[:60] + "...",
                    "count": count
                })
            elif count < 400:
                partial_results += 1
                # Optional: Add partials to list if needed
            else:
                full_results += 1
                
        print(f"\n📊 Podsumowanie Audytu:")
        print(f"-----------------------")
        print(f"Wszystkie głosowania: {total_votes}")
        print(f"✅ Pełne wyniki (>400 głosów): {full_results}")
        print(f"⚠️  Częściowe wyniki (1-399): {partial_results}")
        print(f"🔴 BRAK WYNIKÓW (0 głosów): {zero_results}")
        
        if len(suspicious_list) > 0:
            print(f"\n📋 Lista głosowań bez wyników (Top 50 najnowszych):")
            print(f"{'Data':<12} | {'Pos.':<5} | {'Nr':<5} | {'Tytuł'}")
            print("-" * 80)
            # Show top 50 mostly recent ones
            for item in suspicious_list[:50]:
                print(f"{str(item['date']):<12} | {item['sitting']:<5} | {item['vote_curr']:<5} | {item['title']}")
                
            if len(suspicious_list) > 50:
                print(f"... i {len(suspicious_list) - 50} więcej.")
                
        conn.close()
        
    except Exception as e:
        print(f"Błąd: {e}")

if __name__ == "__main__":
    analyze_vote_coverage()
