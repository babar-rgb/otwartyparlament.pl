-- Day 1 Enhancement: Club Memberships - Professional Grade
-- Add constraints, indexes, and helper views

-- Step 1: Add unique constraint (MP can't be in 2 clubs simultaneously)
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_memberships_unique_current 
ON club_memberships(mp_id, term) 
WHERE to_date IS NULL;

-- Step 2: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_club_memberships_dates 
ON club_memberships(from_date, to_date);

CREATE INDEX IF NOT EXISTS idx_club_memberships_club_term 
ON club_memberships(club_code, term) 
WHERE to_date IS NULL;

-- Step 3: Add check constraints
ALTER TABLE club_memberships 
ADD CONSTRAINT check_dates_logical 
CHECK (to_date IS NULL OR from_date < to_date);

-- Step 4: Create current memberships view (for easy querying)
CREATE OR REPLACE VIEW current_club_memberships AS
SELECT 
  cm.mp_id,
  m.name as mp_name,
  m.photo_url,
  cm.club_code,
  cm.club_name,
  cm.from_date,
  m.term
FROM club_memberships cm
JOIN mps m ON cm.mp_id = m.id
WHERE cm.to_date IS NULL
ORDER BY cm.club_code, m.name;

-- Step 5: Create club size stats view
CREATE OR REPLACE VIEW club_stats AS
SELECT 
  club_code,
  club_name,
  term,
  COUNT(*) as member_count,
  MIN(from_date) as oldest_membership,
  COUNT(*) FILTER (WHERE from_date = '2023-11-13') as founding_members
FROM club_memberships
WHERE to_date IS NULL
GROUP BY club_code, club_name, term
ORDER BY member_count DESC;

-- Step 6: Add function to check party switches
CREATE OR REPLACE FUNCTION get_mp_club_history(mp_id_param INTEGER)
RETURNS TABLE (
  club_code TEXT,
  club_name TEXT,
  from_date DATE,
  to_date DATE,
  duration_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.club_code,
    cm.club_name,
    cm.from_date,
    cm.to_date,
    COALESCE(cm.to_date, CURRENT_DATE) - cm.from_date as duration_days
  FROM club_memberships cm
  WHERE cm.mp_id = mp_id_param
  ORDER BY cm.from_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Verify data quality
SELECT 
  'Total memberships' as metric, 
  COUNT(*)::text as value 
FROM club_memberships
UNION ALL
SELECT 
  'Current memberships', 
  COUNT(*)::text 
FROM club_memberships 
WHERE to_date IS NULL
UNION ALL
SELECT 
  'MPs without club', 
  COUNT(*)::text 
FROM mps m 
LEFT JOIN club_memberships cm ON m.id = cm.mp_id AND cm.to_date IS NULL
WHERE cm.id IS NULL AND m.active = true
UNION ALL
SELECT 
  'Distinct clubs', 
  COUNT(DISTINCT club_code)::text 
FROM club_memberships;
