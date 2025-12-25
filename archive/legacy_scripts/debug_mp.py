import json
import urllib.request
import os

POSTGREST_URL = "http://localhost:3001"

def fetch_mps():
    url = f"{POSTGREST_URL}/mps?select=name,party,seat_number&limit=1"
    print(f"Fetching sample from: {url}")
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"Error fetching MPs: {e}")
        return []

if __name__ == "__main__":
    mps = fetch_mps()
    if mps:
        print("Sample MP Data:")
        print(json.dumps(mps[0], indent=2))
    else:
        print("No data found.")
