-- Migration: Multi-Term Support (v2 - Integer IDs)
-- Goal: Make IDs globally unique by including the term number using INTEGER offsets.

-- 1. Enable Deferred Constraints check if needed, OR just change to CASCADE first.
-- We will change FKs to CASCADE to allow ID updates to propagate.

BEGIN;

-- A. Update Foreign Keys to CASCADE
-- vote_results -> mps
ALTER TABLE vote_results DROP CONSTRAINT IF EXISTS "vote_results_mp_id_fkey";
ALTER TABLE vote_results ADD CONSTRAINT "vote_results_mp_id_fkey" 
    FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- vote_results -> votes
ALTER TABLE vote_results DROP CONSTRAINT IF EXISTS "vote_results_vote_id_fkey";
ALTER TABLE vote_results ADD CONSTRAINT "vote_results_vote_id_fkey" 
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- interpellation_authors -> mps
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'interpellation_authors') THEN
        ALTER TABLE interpellation_authors DROP CONSTRAINT IF EXISTS "interpellation_authors_mp_id_fkey";
        ALTER TABLE interpellation_authors ADD CONSTRAINT "interpellation_authors_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;

        -- interpellation_authors -> interpellations
        ALTER TABLE interpellation_authors DROP CONSTRAINT IF EXISTS "interpellation_authors_interpellation_id_fkey";
        ALTER TABLE interpellation_authors ADD CONSTRAINT "interpellation_authors_interpellation_id_fkey" 
            FOREIGN KEY (interpellation_id) REFERENCES interpellations(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- speeches -> mps (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches DROP CONSTRAINT IF EXISTS "speeches_mp_id_fkey";
        ALTER TABLE speeches ADD CONSTRAINT "speeches_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- B. Add 'term' columns
ALTER TABLE mps ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
-- Add term to speeches if exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
    END IF;
END $$;

-- C. Update IDs (Propagates via CASCADE)
-- Update MPs: Term 10 IDs become 10000 + id.
-- Only update if they are small (original IDs are usually < 500).
UPDATE mps SET id = 10000 + id WHERE id < 1000;

-- Update Votes: Term 10 IDs become 100000000 + id (if using the old logic) or whatever schema we want.
-- Current ID: sitting * 10000 + number.
-- New ID: 100000000 + id.
-- Check if we need to update IDs to avoid collision with Term 9.
UPDATE votes SET id = 100000000 + id WHERE id < 100000000;

-- Update Interpellations: Term 10 IDs become 100000 + id (Max ~40k)
UPDATE interpellations SET id = 100000 + id WHERE id < 100000;

-- D. Fix Unique Constraints
-- Drop the old constraint that prevents multi-term votes
ALTER TABLE votes DROP CONSTRAINT IF EXISTS "votes_sitting_voting_number_key";
-- Add new unique constraint including term
-- We use a partial index or just a standard unique index.
DROP INDEX IF EXISTS votes_term_sitting_voting_idx;
CREATE UNIQUE INDEX votes_term_sitting_voting_idx ON votes(term, sitting, voting_number);

COMMIT;
