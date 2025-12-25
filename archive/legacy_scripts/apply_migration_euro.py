import os
from supabase import create_client, Client

# Manual env
try:
    with open('.env') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                os.environ[k] = v.strip().strip('"').strip("'")
except: pass

url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("Cannot connect.")
    exit(1)
    
supabase: Client = create_client(url, key)

sql = """
-- Add scoring columns to euro_votes
alter table euro_votes 
add column if not exists importance_score int default 0,
add column if not exists is_key_vote boolean default false;

-- Create index for faster sorting by importance
create index if not exists idx_euro_votes_importance on euro_votes(importance_score desc);
create index if not exists idx_euro_votes_is_key on euro_votes(is_key_vote);
"""

# There is no direct "exec_sql" in supabase-py, needs RPC or just creating a function.
# But I can't create RPC easily without dashboard.
# I will try to use `rpc` if a query function exists, but it likely doesn't.
# Wait, I have direct Postgres access via `supabase` potentially? No, just the client.
# I might need to rely on the user to run the migration or hope `Supavisor` tool works (it failed before).

# Plan B: The user has `scripts/run_sql.py`? No.
# Plan C: I will create a function via the `supabase` object if I can? No.
# Actually, I can use the `postgres` library if I had the connection string.
# .env has `SUPABASE_URL` but likely not the raw DB connection string.

# However, the user provided `supabase/migration_euro_votes.sql` earlier... so maybe I can't apply it easily.

# Correction: I am an agent. I can ask the user? No, I should try to solve it.
# The `read_resource` earlier failed on `supavisor`.

# Let's try `psycopg2` if available.
# Or ask user?
# Wait, I see `check_parties.sql` in file list. Maybe there's a mechanism.

# Actually, I will Proceed assuming the table MIGHT be updated or I can use `rpc` if I create one?
# Re-reading `scripts/` directory content in step 835...
# No SQL runner.

# Let's check `scripts/import_transcripts.py` imports.
# It uses `supabase`.

# I will try to run the logic WITHOUT the migration applied yet, but `upsert` will fail if columns don't exist.
# USEFUL HACK: I can use the `rpc` method if I can find an arbitrary SQL execution function.
# Often setups have `exec_sql`.

# Let's try to list RPCs?
# `response = supabase.rpc('get_service_role_config').execute()`

# If I cannot apply migration, I'm blocked on adding columns.
# But wait, looking at `scripts/setup_db.py` (if it exists) might help.

# Let's look at `.env` content from step 915.
# `SUPABASE_SERVICE_ROLE_KEY` is present.
# I can use the REST API `postgrest`? No.

# Wait, `supabase-py` client doesn't support raw SQL unless via RPC.
# I will create a python script that connects using `psycopg2`?
# I need the connection string.
# `SUPABASE_URL` is `https://xmlsuhshmmrfwhdammcv.supabase.co`
# `DB_URL` usually `postgresql://postgres:[PASSWORD]@db.xmlsuhshmmrfwhdammcv.supabase.co:5432/postgres`
# I don't have the password.

# OK, I will try to use the `supabase` query builder to see if I can simply `update` a non-existent column and get an error, proving it's missing.
# If missing, I'm stuck unless I can run SQL.

# Maybe I can assume the user will run the migration or has an auto-migration tool?
# User said "Update the ETL scripts".

# I will write the SQL file.
# And I will TRY to execute it via `psql` if `psql` is in the path?
# Operating System: mac. Shell: zsh.
# `psql` might be installed.
# But I need the connection string.

# Let's look at `package.json`. Maybe there is a migration command.
pass
