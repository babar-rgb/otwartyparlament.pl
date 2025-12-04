import os
import requests
import json
import time
from datetime import datetime
from supabase import create_client, Client

# Manually load .env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                os.environ[key] = value
except Exception:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Credentials required (Supabase).")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

API_BASE = "https://api.sejm.gov.pl/sejm/term10"

def import_transcripts():
    print("Starting Transcripts Import...")

    # 1. Get list of proceedings (sittings)
    print("Fetching proceedings list...")
    r = requests.get(f"{API_BASE}/proceedings")
    proceedings = r.json()
    
    # Filter out sittings with no dates or future dates
    today = datetime.now().strftime("%Y-%m-%d")
    valid_proceedings = []
    
    for p in proceedings:
        if not p.get('dates'):
            continue
            
        # Check if any date in the sitting is in the past
        past_dates = [d for d in p['dates'] if d <= today]
        if past_dates:
            # Use only past dates for this sitting
            p['dates'] = past_dates
            valid_proceedings.append(p)
    
    # Sort by date descending
    valid_proceedings.sort(key=lambda x: x['dates'][0], reverse=True)
    
    # Limit to last 5 sittings
    recent_proceedings = valid_proceedings[:5]
    
    print(f"Found {len(valid_proceedings)} valid proceedings. Processing last {len(recent_proceedings)}.")

    for proc in recent_proceedings:
        sitting_num = proc['number']
        dates = proc['dates']
        print(f"Processing Sitting {sitting_num} ({len(dates)} days)...")
        
        for date in dates:
            print(f"  Fetching transcripts for {date}...")
            
            # Get list of statements for this day
            try:
                r_transcripts = requests.get(f"{API_BASE}/proceedings/{sitting_num}/{date}/transcripts")
                if r_transcripts.status_code != 200:
                    print(f"    Failed to fetch transcripts list: {r_transcripts.status_code}")
                    continue
                    
                data = r_transcripts.json()
                statements = data.get('statements', [])
                
                print(f"    Found {len(statements)} statements.")
                
                for stmt in statements:
                    # Skip unspoken statements or non-MP speakers if desired (but we want everything for context)
                    # We definitely want to link to MPs if possible
                    
                    member_id = stmt.get('memberID')
                    speaker_name = stmt.get('name')
                    stmt_num = stmt.get('num')
                    
                    # Fetch the actual text content
                    # Endpoint: /proceedings/{sitting}/{date}/transcripts/{num}
                    url = f"{API_BASE}/proceedings/{sitting_num}/{date}/transcripts/{stmt_num}"
                    r_text = requests.get(url)
                    
                    if r_text.status_code != 200:
                        print(f"      Failed to fetch text for statement {stmt_num} (Status: {r_text.status_code})")
                        continue
                        
                    try:
                        # The API returns HTML in the response body, not JSON
                        # We need to parse it
                        from bs4 import BeautifulSoup
                        soup = BeautifulSoup(r_text.content, 'html.parser')
                        
                        # The text seems to be in the body, often in blockquote or just paragraphs
                        # Let's extract all text from body
                        body = soup.find('body')
                        if body:
                            content = body.get_text(separator="\n", strip=True)
                        else:
                            content = soup.get_text(separator="\n", strip=True)
                            
                    except Exception as e:
                        print(f"      Failed to parse HTML from {url}: {e}")
                        continue
                    
                    if not content:
                        continue

                    # Try to match MP ID
                    mp_id = None
                    if member_id and member_id > 0:
                        mp_id = member_id
                    
                    # Insert into DB
                    try:
                        supabase.table('speeches').upsert({
                            'mp_id': mp_id,
                            'sitting': sitting_num,
                            'date': date,
                            'speaker_name': speaker_name,
                            'content': content,
                            'topic': '', 
                            'statement_num': stmt_num
                        }, on_conflict='mp_id, sitting, date, statement_num').execute()
                        # print(f"      Saved speech by {speaker_name}")
                    except Exception as e:
                        print(f"      Error saving speech: {e}")
                        
            except Exception as e:
                print(f"    Error processing day {date}: {e}")

if __name__ == "__main__":
    import_transcripts()
