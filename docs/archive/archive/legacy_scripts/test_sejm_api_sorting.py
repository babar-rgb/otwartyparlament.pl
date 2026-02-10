
import requests
import json

base_url = "https://api.sejm.gov.pl/sejm/term10/processes"

def test_params(name, params):
    print(f"--- Testing {name} ---")
    try:
        response = requests.get(base_url, params=params)
        print("Headers:", response.headers)
        data = response.json()
        if isinstance(data, list) and len(data) > 0:
            print(f"Returned {len(data)} items.")
            print(f"First item date: {data[0].get('processStartDate')}")
            print(f"Last item date: {data[-1].get('processStartDate')}")
        else:
            print("No data or not a list.")
    except Exception as e:
        print(f"Error: {e}")

# Test 1: Default
test_params("Default (limit=5)", {"limit": 5})

# Test 2: Sort by date desc
test_params("Sort by date desc", {"limit": 5, "sort": "date", "desc": "true"})

# Test 3: Sort by date
test_params("Sort by date", {"limit": 5, "sort": "date"})

# Test 4: Order desc
test_params("Order desc", {"limit": 5, "order": "desc"})

# Test 5: Sort by id desc
test_params("Sort by id desc", {"limit": 5, "sort": "id", "desc": "true"})
