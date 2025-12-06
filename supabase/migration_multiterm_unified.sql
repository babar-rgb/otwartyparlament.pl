-- MIGRATION: Multi-Term Support (Unified)
-- Consolidates dropping constraints, updating IDs, and restoring constraints.

SET statement_timeout = 0;

BEGIN;

-- ==========================================
-- PART 1: DROP FOREIGN KEYS & CONSTRAINTS
-- ==========================================

-- 1. vote_results
ALTER TABLE vote_results DROP CONSTRAINT IF EXISTS "vote_results_mp_id_fkey";
ALTER TABLE vote_results DROP CONSTRAINT IF EXISTS "vote_results_vote_id_fkey";

-- 2. interpellations / interpellation_authors
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        ALTER TABLE interpellation_authors DROP CONSTRAINT IF EXISTS "interpellation_authors_mp_id_fkey";
        ALTER TABLE interpellation_authors DROP CONSTRAINT IF EXISTS "interpellation_authors_interpellation_id_fkey";
    END IF;
END $$;

ALTER TABLE interpellations DROP CONSTRAINT IF EXISTS "interpellations_mp_id_fkey";

-- 3. speeches
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches DROP CONSTRAINT IF EXISTS "speeches_mp_id_fkey";
    END IF;
END $$;

-- 4. asset_declarations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_declarations') THEN
        ALTER TABLE asset_declarations DROP CONSTRAINT IF EXISTS "asset_declarations_mp_id_fkey";
    END IF;
END $$;


-- ==========================================
-- PART 2: UPDATE TABLES & IDs
-- ==========================================

-- 1. Add 'term' columns
ALTER TABLE mps ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
    END IF;
END $$;

-- 2. Update MPs (IDs 1..999 -> 10001..10999)
UPDATE mps SET id = 10000 + id WHERE id < 1000;

-- 3. Update Dependencies for MPs (Manual Propagate)
UPDATE vote_results SET mp_id = 10000 + mp_id WHERE mp_id < 1000;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        UPDATE interpellation_authors SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    ELSE
        UPDATE interpellations SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        UPDATE speeches SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_declarations') THEN
        UPDATE asset_declarations SET mp_id = 10000 + mp_id WHERE mp_id < 1000;
    END IF;
END $$;

-- 4. Update Votes (IDs -> 100,000,000 + ID)
UPDATE votes SET id = 100000000 + id WHERE id < 100000000;
-- Propagate to vote_results
UPDATE vote_results SET vote_id = 100000000 + vote_id WHERE vote_id < 100000000;

-- 5. Update Interpellations (IDs -> 100,000 + ID)
UPDATE interpellations SET id = 100000 + id WHERE id < 100000;
-- Propagate to authors
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        UPDATE interpellation_authors SET interpellation_id = 100000 + interpellation_id WHERE interpellation_id < 100000;
    END IF;
END $$;


-- ==========================================
-- PART 3: RESTORE CONSTRAINTS
-- ==========================================

-- 1. Restore vote_results
ALTER TABLE vote_results ADD CONSTRAINT "vote_results_mp_id_fkey" 
    FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE vote_results ADD CONSTRAINT "vote_results_vote_id_fkey" 
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Restore interpellation_authors / interpellations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        ALTER TABLE interpellation_authors ADD CONSTRAINT "interpellation_authors_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;

        ALTER TABLE interpellation_authors ADD CONSTRAINT "interpellation_authors_interpellation_id_fkey" 
            FOREIGN KEY (interpellation_id) REFERENCES interpellations(id) ON DELETE CASCADE ON UPDATE CASCADE;
    ELSE
         ALTER TABLE interpellations ADD CONSTRAINT "interpellations_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 3. Restore speeches
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches ADD CONSTRAINT "speeches_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Restore asset_declarations
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_declarations') THEN
        ALTER TABLE asset_declarations ADD CONSTRAINT "asset_declarations_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. FIX UNIQUE CONSTRAINT ON VOTES
ALTER TABLE votes DROP CONSTRAINT IF EXISTS "votes_sitting_voting_number_key";
DROP INDEX IF EXISTS votes_term_sitting_voting_idx;
CREATE UNIQUE INDEX votes_term_sitting_voting_idx ON votes(term, sitting, voting_number);

COMMIT;
