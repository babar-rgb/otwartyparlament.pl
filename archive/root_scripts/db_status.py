from supabase import create_client
import os
from urllib.parse import urlparse

from dotenv import dotenv_values, load_dotenv

load_dotenv()
env = dotenv_values(".env")

url = os.environ.get("SUPABASE_URL") or env.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or env.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY") or env.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY") or env.get("VITE_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"--- DB STATUS ---")
if not url:
    print("URL not found in .env")
else:
    try:
        parsed = urlparse(url)
        print(f"Host: {parsed.hostname}")
        print(f"Port: {parsed.port or 443} (Default HTTPS for Cloud)")
    except:
        print(f"URL: {url}")

if not url or not key:
    print("Missing Credentials to check data.")
    exit(1)

sb = create_client(url, key)

try:
    meps = sb.table('euro_meps').select('count', count='exact').execute()
    print(f"Euro MEPs: {meps.count}")
except Exception as e: print(f"Euro MEPs Error: {e}")

try:
    votes = sb.table('euro_votes').select('count', count='exact').execute()
    print(f"Euro Votes: {votes.count}")
except Exception as e: print(f"Euro Votes Error: {e}")

try:
    results = sb.table('euro_vote_results').select('count', count='exact').execute()
    print(f"Euro Results: {results.count}")
except Exception as e: print(f"Euro Results Error: {e}")
