from supabase import create_client
import os
from dotenv import dotenv_values, load_dotenv

load_dotenv()
env = dotenv_values(".env")

url = os.environ.get("SUPABASE_URL") or env.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or env.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY") or env.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY") or env.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Credentials missing")
    exit(1)

sb = create_client(url, key)

target_id = "MTG-PL-2024-12-19-OTH-2017009355268"

print(f"Deleting target {target_id}...")
sb.table('euro_votes').delete().eq('id', target_id).execute()

# Also delete any NULLs
print("Deleting NULL votes...")
# Supabase py filter for null? .is_('votes_for', 'null')
sb.table('euro_votes').delete().is_('votes_for', 'null').execute()

print("Done.")
