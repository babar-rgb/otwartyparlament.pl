import requests
import json

EU_API_URL = "https://data.europarl.europa.eu/api/v2/meps/show-current?format=application%2Fld%2Bjson&offset=0&limit=10"

def debug_api():
    print("Fetching RAW API data...")
    response = requests.get(EU_API_URL)
    data = response.json()
    
    # Inspect 'data' key
    if 'data' in data:
        inner_data = data['data']
        print(f"Type of data['data']: {type(inner_data)}")
        
        if isinstance(inner_data, list):
            print(f"List length: {len(inner_data)}")
            if len(inner_data) > 0:
                print("First item:")
                print(json.dumps(inner_data[0], indent=2))
        elif isinstance(inner_data, dict):
            print("Keys in inner_data:", inner_data.keys())
            if 'mepShowCurrent' in inner_data:
                 print(f"Found mepShowCurrent inside data! Length: {len(inner_data['mepShowCurrent'])}")

if __name__ == "__main__":
    debug_api()
