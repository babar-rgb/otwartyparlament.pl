import requests
import json

def check_mp(term, mp_id):
    url = f"https://api.sejm.gov.pl/sejm/term{term}/MP/{mp_id}"
    print(f"Checking URL: {url}")
    resp = requests.get(url)
    if resp.status_code == 200:
        data = resp.json()
        print(f"Data for MP {mp_id}:")
        print(f"Name: {data.get('firstName')} {data.get('lastName')}")
        print(f"numberOfSeat: {data.get('numberOfSeat')}") # Crucial check
        print(f"Full Keys: {list(data.keys())}")
    else:
        print(f"Error: {resp.status_code}")

if __name__ == "__main__":
    check_mp(10, 1) # Andrzej Adamczyk
    print("\n")
    check_mp(10, 401) # Check a random high ID
