import os
from dotenv import load_dotenv

load_dotenv()

anon = os.environ.get("VITE_SUPABASE_ANON_KEY") or ""
service = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""

print(f"Anon Prefix: {anon[:10]}")
print(f"Service Prefix: {service[:10]}")

if anon == service:
    print("⚠️  KEYS ARE IDENTICAL. YOU DO NOT HAVE ADMIN ACCESS.")
else:
    print("✅ Keys are DIFFERENT.")
