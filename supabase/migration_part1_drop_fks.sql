-- PART 1: DROP FOREIGN KEYS
-- We drop them to allow manual ID updates without immediate cascading overhead or lock contention.

BEGIN;

-- vote_results
ALTER TABLE vote_results DROP CONSTRAINT IF EXISTS "vote_results_mp_id_fkey";
ALTER TABLE vote_results DROP CONSTRAINT IF EXISTS "vote_results_vote_id_fkey";

-- interpellations / interpellation_authors
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        ALTER TABLE interpellation_authors DROP CONSTRAINT IF EXISTS "interpellation_authors_mp_id_fkey";
        ALTER TABLE interpellation_authors DROP CONSTRAINT IF EXISTS "interpellation_authors_interpellation_id_fkey";
    END IF;
END $$;

ALTER TABLE interpellations DROP CONSTRAINT IF EXISTS "interpellations_mp_id_fkey";

-- speeches
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches DROP CONSTRAINT IF EXISTS "speeches_mp_id_fkey";
    END IF;
END $$;

-- asset_declarations (migration_digitization.sql)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_declarations') THEN
        ALTER TABLE asset_declarations DROP CONSTRAINT IF EXISTS "asset_declarations_mp_id_fkey";
    END IF;
END $$;

COMMIT;
