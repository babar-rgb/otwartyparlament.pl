import requests
import json

API_BASE = "https://api.sejm.gov.pl/sejm/term10"

def test_api():
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Get latest sittings
    r = requests.get(f"{API_BASE}/proceedings")
    proceedings = r.json()
    
    # Filter to past dates only
    valid = []
    for p in proceedings:
        past_dates = [d for d in p.get('dates', []) if d <= today]
        if past_dates:
            valid.append({'number': p['number'], 'dates': past_dates})
    
    if not valid:
        print("No valid past sittings found")
        return
        
    # Sort by latest date descending
    valid.sort(key=lambda x: x['dates'][-1], reverse=True)
    latest = valid[0]
    sitting_num = latest['number']
    date = latest['dates'][-1]
    
    print(f"Testing sitting {sitting_num}, date {date}")
    
    # Get transcripts list
    r_trans = requests.get(f"{API_BASE}/proceedings/{sitting_num}/{date}/transcripts")
    data = r_trans.json()
    statements = data.get('statements', [])
    
    if not statements:
        print("No statements found.")
        return
        
    stmt = statements[0]
    print(f"Statement meta: {json.dumps(stmt, indent=2)}")
    
    if 'text' in stmt:
        print("Text found in bulk response!")
    else:
        print("Text NOT found in bulk response.")
        
    # Check single statement endpoint
    num = stmt['num']
    url = f"{API_BASE}/proceedings/{sitting_num}/{date}/transcripts/{num}"
    r_single = requests.get(url)
    print(f"Single stmt content type: {r_single.headers.get('Content-Type')}")
    print(f"Preview: {r_single.text[:200]}")

if __name__ == "__main__":
    test_api()
