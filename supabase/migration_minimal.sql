-- MINIMAL MIGRATION
-- 1. Add 'term' column to tables (so we can distinguish terms)
ALTER TABLE mps ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
-- And speeches if exists
DO $$ BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
    END IF;
END $$;

-- 2. Drop the blocking constraint
-- This allows duplicate sitting/voting numbers as long as IDs are different (which they will be)
ALTER TABLE votes DROP CONSTRAINT IF EXISTS "votes_sitting_voting_number_key";

-- 3. (Optional) Create new index to be safe, but not strictly required to unblock
CREATE UNIQUE INDEX IF NOT EXISTS votes_term_sitting_voting_idx ON votes(term, sitting, voting_number);
