-- PHASE 1: DATABASE ARCHITECTURE (Europarlament)

-- 1. Create table for European Parliament Members (MEPs)
CREATE TABLE IF NOT EXISTS euro_meps (
    id SERIAL PRIMARY KEY,
    api_id INT UNIQUE NOT NULL,       -- Official EU API ID
    full_name TEXT NOT NULL,
    country TEXT DEFAULT 'Poland',
    national_party TEXT,              -- e.g., "Prawo i Sprawiedliwość"
    eu_group TEXT,                    -- e.g., "EPP", "ECR", "S&D" (Crucial for context)
    photo_url TEXT,
    email TEXT,
    active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE euro_meps ENABLE ROW LEVEL SECURITY;

-- 3. Create Public Read Policy
DROP POLICY IF EXISTS "Public Read Euro" ON euro_meps;
CREATE POLICY "Public Read Euro" ON euro_meps FOR SELECT USING (true);

-- 4. Grant access to authenticated and anon roles (standard Supabase setup)
GRANT SELECT ON euro_meps TO anon, authenticated, service_role;
