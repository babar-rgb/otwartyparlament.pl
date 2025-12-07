-- Quick Fix: Party Name Normalization
-- Resolves duplicate party names causing UX inconsistencies

-- Fix 1: Konfederacja duplicates
UPDATE mps SET party = 'Konfederacja' 
WHERE party IN ('Konfederacja_KP', 'KP');

-- Fix 2: Polska2050 duplicates  
UPDATE mps SET party = 'Polska2050' 
WHERE party IN ('Polska2050-TD');

-- Fix 3: Ensure consistent formatting for minor parties
UPDATE mps SET party = 'Kukiz15' WHERE party = 'Kukiz''15';  -- Remove apostrophe if exists
UPDATE mps SET party = 'Lewica' WHERE party IN ('LD', 'Razem');  -- Unify left-wing coalition

-- Verify results
SELECT party, count(*) as mp_count 
FROM mps 
WHERE active = true 
GROUP BY party 
ORDER BY count(*) DESC;

-- Expected result:
-- PiS:         188
-- KO:          156
-- PSL-TD:       32
-- Polska2050:   31
-- Lewica:       21-25 (after merging)
-- Konfederacja: 19 (16 + 3)
-- Others:       <10
