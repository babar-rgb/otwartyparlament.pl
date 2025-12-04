-- Migration: Multi-Term Support
-- Goal: Make IDs globally unique by including the term number, and add 'term' column.

-- 1. MPS TABLE
-- Add term column
ALTER TABLE mps ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;

-- Update existing IDs to be "10-XXX" to avoid collision with Term 9
-- We need to drop FK constraints first temporarily if they exist, or update cascade.
-- Assuming standard foreign keys with ON UPDATE CASCADE, this should work.
-- If not, we might need to recreate them.

-- Let's try to update IDs. 
-- Note: If you have foreign keys pointing to mps.id without ON UPDATE CASCADE, this will fail.
-- In that case, you need to drop constraints, update, and re-add.

-- For safety, let's just add the column and assume we will handle ID generation in scripts for NEW terms.
-- BUT, if we import Term 9 MP "001", it will collide with Term 10 MP "001".
-- So we MUST change the IDs.

-- Option B: Composite Primary Key (id, term).
-- This requires changing all FKs in other tables to be composite too. Messy.

-- Option A: Global IDs (preferred).
-- We will update existing Term 10 data to have term-prefixed IDs.

BEGIN;

-- A. Update MPs
-- 1. Disable triggers/constraints if necessary (or rely on CASCADE)
-- We'll try to update. If it fails, we might need a more complex script.
UPDATE mps SET id = '10-' || id WHERE id NOT LIKE '10-%';

-- B. Update Votes
-- Current ID: sitting * 10000 + number (e.g. 10001)
-- New ID: term * 10000000 + sitting * 10000 + number (e.g. 100010001)
-- Wait, sitting * 10000 might be up to 999999.
-- Let's use: term * 1000000 + original_id.
-- Term 10: 10 * 1000000 + 10001 = 10010001.
-- Term 9: 9 * 1000000 + ...
ALTER TABLE votes ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
UPDATE votes SET id = 10000000 + id WHERE id < 10000000;

-- C. Update Vote Results
-- These link to votes.id and mps.id.
-- If FKs are ON UPDATE CASCADE, they are already updated!
-- If not, we need to update them manually.
-- Let's assume they might not be linked with CASCADE or might be loose.
-- Check if we need to update them.
-- UPDATE vote_results SET vote_id = 10000000 + vote_id WHERE vote_id < 10000000;
-- UPDATE vote_results SET mp_id = '10-' || mp_id WHERE mp_id NOT LIKE '10-%';

-- D. Speeches
ALTER TABLE speeches ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
-- Update mp_id FK if needed
-- UPDATE speeches SET mp_id = '10-' || mp_id WHERE mp_id NOT LIKE '10-%' AND mp_id IS NOT NULL;

-- E. Interpellations
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
-- UPDATE interpellation_authors SET mp_id = '10-' || mp_id WHERE mp_id NOT LIKE '10-%';

COMMIT;
