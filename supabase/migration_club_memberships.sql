-- Club Memberships History Table
-- Tracks MPs changing parties/clubs over time

CREATE TABLE IF NOT EXISTS club_memberships (
  id SERIAL PRIMARY KEY,
  mp_id INTEGER NOT NULL REFERENCES mps(id),
  club_code TEXT NOT NULL,        -- "PiS", "KO", "Polska2050", etc.
  club_name TEXT NOT NULL,         -- Full name "Prawo i Sprawiedliwość"
  from_date DATE NOT NULL,
  to_date DATE,                    -- NULL = current membership
  term INTEGER NOT NULL,
  reason TEXT,                     -- "Przejście do innego klubu", "Wykluczenie", "Zakończenie kadencji"
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_memberships_mp ON club_memberships(mp_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_club ON club_memberships(club_code);
CREATE INDEX IF NOT EXISTS idx_club_memberships_current ON club_memberships(mp_id) WHERE to_date IS NULL;

-- Populate with current data from mps table
-- (Will be extended by ETL script with historical data)
INSERT INTO club_memberships (mp_id, club_code, club_name, from_date, to_date, term)
SELECT 
  id as mp_id,
  party as club_code,
  party as club_name,  -- Will be enriched by ETL
  '2023-11-13'::date as from_date,  -- Term 10 start
  NULL as to_date,  -- Current
  term
FROM mps
WHERE active = true
ON CONFLICT DO NOTHING;

-- Verify
SELECT club_code, count(*) as member_count 
FROM club_memberships 
WHERE to_date IS NULL  -- Current memberships
GROUP BY club_code 
ORDER BY count(*) DESC;
