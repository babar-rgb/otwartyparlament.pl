
import os
import json
from supabase import create_client, Client

# Manually load .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

url: str = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set.")
    exit(1)

supabase: Client = create_client(url, key)

print("--- Checking Asset Declarations ---")
try:
    response = supabase.table('asset_declarations').select("id, mp_id, parsed_content").execute()
    declarations = response.data
    print(f"Total declarations: {len(declarations)}")

    valid_savings = 0
    valid_income = 0
    valid_properties = 0
    
    top_savings = []
    top_income = []

    for d in declarations:
        content = d.get('parsed_content')
        if not content:
            continue
        
        savings = content.get('savings', 0)
        income = content.get('income', 0)
        properties = len(content.get('real_estate', []))

        if savings > 0: valid_savings += 1
        if income > 0: valid_income += 1
        if properties > 0: valid_properties += 1

        top_savings.append((d['mp_id'], savings))
        top_income.append((d['mp_id'], income))

    print(f"Declarations with savings > 0: {valid_savings}")
    print(f"Declarations with income > 0: {valid_income}")
    print(f"Declarations with properties > 0: {valid_properties}")

    top_savings.sort(key=lambda x: x[1], reverse=True)
    top_income.sort(key=lambda x: x[1], reverse=True)

    print("\nTop 3 Savings:")
    for mp_id, val in top_savings[:3]:
        print(f"MP {mp_id}: {val}")

    print("\nTop 3 Income:")
    for mp_id, val in top_income[:3]:
        print(f"MP {mp_id}: {val}")

except Exception as e:
    print(f"Error: {e}")
