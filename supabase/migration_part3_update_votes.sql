-- PART 3: UPDATE VOTES & INTERPELLATIONS
-- Add term columns and update IDs.

BEGIN;

-- 1. Add term columns
ALTER TABLE votes ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
    END IF;
END $$;

-- 2. Update Votes IDs (Old ID -> 100000000 + ID)
UPDATE votes SET id = 100000000 + id WHERE id < 100000000;

-- 3. Propagate to vote_results
UPDATE vote_results SET vote_id = 100000000 + vote_id WHERE vote_id < 100000000;

-- 4. Update Interpellations
UPDATE interpellations SET id = 100000 + id WHERE id < 100000;

-- 5. Propagate to interpellation_authors
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        UPDATE interpellation_authors SET interpellation_id = 100000 + interpellation_id WHERE interpellation_id < 100000;
    END IF;
END $$;

COMMIT;
