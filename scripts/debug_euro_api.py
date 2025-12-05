import requests
import json

EU_API_URL = "https://data.europarl.europa.eu/api/v2/meps/show-current?format=application%2Fld%2Bjson&offset=0&limit=1000"

print("Fetching API...")
response = requests.get(EU_API_URL)
data = response.json()

target_ids = ["257051", "197517"] # Buła (bad), Jarubas (good)

for mep in data.get('data', []):
    mep_id = mep.get('identifier')
    if str(mep_id) in target_ids:
        print(f"\n--- MEP {mep_id} ({mep.get('label')}) ---")
        print(json.dumps(mep, indent=2))
