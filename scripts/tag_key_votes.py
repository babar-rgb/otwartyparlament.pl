
import os
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

# Define key topics and their keywords
key_topics = {
    "Ustawa Łańcuchowa (Ochrona Zwierząt)": ["ochronie zwierząt", "ubezpieczeniach upraw rolnych i zwierząt"],
    "Budżet 2024": ["ustawy budżetowej na rok 2024"],
    "In Vitro": ["finansowaniu in vitro"],
    "Wybór Marszałka": ["Wybór Marszałka Sejmu"],
    "Wotum Zaufania": ["wotum zaufania"],
    "Aborcja / Zdrowie": ["przerywania ciąży", "świadczeniach opieki zdrowotnej"]
}

print("--- Tagging Key Votes ---")

for topic, keywords in key_topics.items():
    print(f"\nProcessing topic: {topic}")
    for kw in keywords:
        try:
            # Find votes matching the keyword
            response = supabase.table("votes").select("id, title_clean").ilike("title_clean", f"%{kw}%").execute()
            
            if response.data:
                ids_to_update = [item['id'] for item in response.data]
                print(f"  Found {len(ids_to_update)} votes for '{kw}'. Updating...")
                
                # Update is_key_vote = true
                update_response = supabase.table("votes").update({"is_key_vote": True}).in_("id", ids_to_update).execute()
                print(f"  Updated {len(update_response.data)} votes.")
            else:
                print(f"  No votes found for '{kw}'.")
                
        except Exception as e:
            print(f"  Error processing '{kw}': {e}")

print("\nDone.")
