-- PART 2: UPDATE MPS
-- Add term column and update IDs.
-- We must manually update the REFERENCING columns since we dropped CASCADE FKs.

BEGIN;

-- 1. Add term
ALTER TABLE mps ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;

-- 2. Update MPs IDs (1 -> 10001) for existing data (Term 10 implied)
-- Only update if ID < 1000 (assuming valid API IDs are small integers)
UPDATE mps SET id = 10000 + id WHERE id < 1000;

-- 3. Manually propagate to vote_results
UPDATE vote_results SET mp_id = 10000 + mp_id WHERE mp_id < 1000;

-- 4. Manually propagate to interpellation_authors / interpellations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        UPDATE interpellation_authors SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    ELSE
        UPDATE interpellations SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    END IF;
END $$;

-- 5. Propagate to speeches
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        UPDATE speeches SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    END IF;
END $$;

-- 6. Propagate to asset_declarations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_declarations') THEN
        UPDATE asset_declarations SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    END IF;
END $$;

COMMIT;
