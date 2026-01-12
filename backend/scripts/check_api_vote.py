import requests
import json

def check_api():
    url = "https://api.sejm.gov.pl/sejm/term10/votings/48/69"
    print(f"Fetching {url}...")
    
    resp = requests.get(url)
    if resp.status_code != 200:
        print(f"❌ Error {resp.status_code}")
        return
        
    data = resp.json()
    print("✅ Details from API:")
    print(json.dumps(data, indent=2)[:500] + "...") # First 500 chars
    
    votes = data.get('votes', [])
    print(f"\nVotes count: {len(votes)}")
    
    # Check distribution in API
    counts = {}
    for v in votes:
        res = v.get('vote')
        counts[res] = counts.get(res, 0) + 1
        
    print("API Distribution:", counts)

if __name__ == "__main__":
    check_api()
