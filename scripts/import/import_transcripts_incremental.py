#!/usr/bin/env python3
"""
Incremental Transcripts ETL - PostgreSQL Version
Only fetches NEW transcripts since last run.
Sorts by newest first.
"""

import os
import requests
import time
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

# PostgreSQL connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'otwarty_parlament',
    'user': 'kajtek',
    'password': os.environ.get('PGPASSWORD', '')  # Set via env or leave blank for peer auth
}

API_BASE = "https://api.sejm.gov.pl/sejm/term10"


def get_db_connection():
    """Get PostgreSQL connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"DB Connection Error: {e}")
        # Try without password (peer auth)
        try:
            conn = psycopg2.connect(
                host='localhost',
                port=5432,
                database='otwarty_parlament',
                user='kajtek'
            )
            return conn
        except Exception as e2:
            print(f"Peer auth also failed: {e2}")
            return None


def get_existing_dates(conn):
    """Get set of (sitting, date) already in DB"""
    print("Fetching existing dates from DB...")
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT DISTINCT sitting, date FROM speeches")
            existing = set()
            for row in cur.fetchall():
                existing.add((row[0], str(row[1])))
            print(f"Found {len(existing)} unique (sitting, date) pairs in DB.")
            return existing
    except Exception as e:
        print(f"Error fetching existing dates: {e}")
        return set()


def import_transcripts_incremental(max_sittings=10):
    """Import only new transcripts"""
    print("=" * 60)
    print("  INCREMENTAL TRANSCRIPTS IMPORT (PostgreSQL)")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # Connect to DB
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot connect to database!")
        return

    # 1. Get existing data
    existing = get_existing_dates(conn)

    # 2. Get proceedings from API
    print("\nFetching proceedings list from API...")
    r = requests.get(f"{API_BASE}/proceedings")
    proceedings = r.json()

    # Filter out future dates
    today = datetime.now().strftime("%Y-%m-%d")
    valid_proceedings = []

    for p in proceedings:
        if not p.get('dates'):
            continue
        past_dates = [d for d in p['dates'] if d <= today]
        if past_dates:
            valid_proceedings.append({
                'number': p['number'],
                'dates': past_dates
            })

    # Sort by latest date descending (newest first)
    valid_proceedings.sort(key=lambda x: max(x['dates']), reverse=True)

    print(f"Found {len(valid_proceedings)} valid proceedings.")

    # 3. Find new dates to sync
    new_to_sync = []
    for proc in valid_proceedings:
        for d in sorted(proc['dates'], reverse=True):  # Newest dates first
            if (proc['number'], d) not in existing:
                new_to_sync.append((proc['number'], d))

    if not new_to_sync:
        print("\n✅ All transcripts are up to date!")
        conn.close()
        return

    # Limit to avoid overload
    new_to_sync = new_to_sync[:max_sittings * 3]  # ~3 dates per sitting
    print(f"\n🆕 New dates to sync: {len(new_to_sync)}")

    # 4. Process each new date
    total_statements = 0
    
    for sitting_num, date in new_to_sync:
        print(f"\n  📅 Sitting {sitting_num}, Date {date}...", end=" ", flush=True)

        try:
            r_transcripts = requests.get(f"{API_BASE}/proceedings/{sitting_num}/{date}/transcripts")
            if r_transcripts.status_code != 200:
                print(f"❌ API error {r_transcripts.status_code}")
                continue

            data = r_transcripts.json()
            statements = data.get('statements', [])
            print(f"Found {len(statements)} statements.")

            batch = []
            for stmt in statements:
                member_id = stmt.get('memberID')
                speaker_name = stmt.get('name')
                stmt_num = stmt.get('num')

                # Fetch actual content (HTML)
                url = f"{API_BASE}/proceedings/{sitting_num}/{date}/transcripts/{stmt_num}"
                r_text = requests.get(url)

                if r_text.status_code != 200:
                    continue

                try:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(r_text.content, 'html.parser')
                    body = soup.find('body')
                    content = body.get_text(separator="\n", strip=True) if body else soup.get_text(separator="\n", strip=True)
                except Exception as e:
                    print(f"Parse error: {e}")
                    continue

                if not content:
                    continue

                mp_id = member_id if member_id and member_id > 0 else None

                batch.append((
                    mp_id,
                    sitting_num,
                    date,
                    speaker_name,
                    content,
                    '',  # topic
                    stmt_num,
                    10   # term
                ))

            # Bulk insert
            if batch:
                try:
                    with conn.cursor() as cur:
                        execute_values(cur, """
                            INSERT INTO speeches (mp_id, sitting, date, speaker_name, content, topic, statement_num, term)
                            VALUES %s
                            ON CONFLICT (mp_id, sitting, date, statement_num) DO UPDATE SET
                                content = EXCLUDED.content,
                                speaker_name = EXCLUDED.speaker_name
                        """, batch)
                    conn.commit()
                    total_statements += len(batch)
                    print(f"    ✅ Inserted {len(batch)} statements")
                except Exception as e:
                    print(f"    DB error: {e}")
                    conn.rollback()

            # Rate limit
            time.sleep(0.3)

        except Exception as e:
            print(f"Error: {e}")

    conn.close()

    print("\n" + "=" * 60)
    print(f"  ✅ SYNC COMPLETE")
    print(f"  New statements imported: {total_statements}")
    print("=" * 60)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Incremental transcripts import')
    parser.add_argument('--max-sittings', type=int, default=10, help='Max sittings to process')
    args = parser.parse_args()

    import_transcripts_incremental(max_sittings=args.max_sittings)
