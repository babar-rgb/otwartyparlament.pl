import requests
import json

def inspect_interpellations():
    url = "https://api.sejm.gov.pl/sejm/term10/interpellations?limit=1"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if data:
            item = data[0]
            print(f"Num: {item.get('num')}")
            print(f"Title: {item.get('title')}")
            print(f"From: {item.get('from')}")
        else:
            print("No interpellations found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_interpellations()
