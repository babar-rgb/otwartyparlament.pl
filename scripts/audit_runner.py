import os
import time
from supabase import create_client

# 1. Load Env (Mimic etl_sejm.py)
print("--- AUDIT PHASE 2: CONFIGURATION ---")
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip("'").strip('"')
except Exception as e:
    print(f"Error loading .env: {e}")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"ACTIVE SUPABASE_URL: {url}")
if "localhost" not in url and "127.0.0.1" not in url:
    print("❌ CRITICAL FAIL: URL does not point to Localhost!")
else:
    print("✅ PASS: URL points to Localhost.")

# 2. Latency Test
print("\n--- AUDIT PHASE 3: LATENCY ---")
try:
    client = create_client(url, key)
    
    start = time.time()
    # Fetch 1 row, select only ID to minimize data transfer
    client.table("votes").select("id").limit(1).execute()
    end = time.time()
    
    latency_ms = (end - start) * 1000
    print(f"QUERY LATENCY: {latency_ms:.2f} ms")
    
    if latency_ms < 10:
        print("✅ PASS: Latency < 10ms (Local)")
    else:
        print(f"⚠️ WARN: Latency {latency_ms:.2f}ms (Might be slow local or network)")

except Exception as e:
    print(f"❌ FAIL: Connection Error: {e}")
