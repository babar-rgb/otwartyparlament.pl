import requests
import sys

def test_endpoint(persona="Student"):
    url = f"http://localhost:3001/personas/feed?persona={persona}&limit=5"
    try:
        print(f"Testing {url}...")
        r = requests.get(url)
        if r.status_code == 200:
            data = r.json()
            print(f"✅ Success! Got {len(data)} items.")
            for item in data:
                print(f" - {item['title'][:40]}... -> {item['impact_text']}")
        else:
            print(f"❌ Failed: {r.status_code} {r.text}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    test_endpoint("Student")
    print("-" * 20)
    test_endpoint("Rolnik")
