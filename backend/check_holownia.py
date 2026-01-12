import requests
import json

def check_holownia():
    url = "https://api.sejm.gov.pl/sejm/term10/MP"
    try:
        resp = requests.get(url)
        data = resp.json()
        
        for mp in data:
            if mp['lastName'] == 'Hołownia':
                print("Found Hołownia:")
                # Fetch details
                detail_url = f"https://api.sejm.gov.pl/sejm/term10/MP/{mp['id']}"
                d_resp = requests.get(detail_url)
                print(json.dumps(d_resp.json(), indent=2))
                return
                
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_holownia()
