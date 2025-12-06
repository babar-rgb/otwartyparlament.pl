-- PART 4: RESTORE CONSTRAINTS
-- Re-add FKs with CASCADE (good for future) and fix unique constraints.

BEGIN;

-- 1. Restore vote_results -> mps
ALTER TABLE vote_results ADD CONSTRAINT "vote_results_mp_id_fkey" 
    FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Restore vote_results -> votes
ALTER TABLE vote_results ADD CONSTRAINT "vote_results_vote_id_fkey" 
    FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Restore interpellation_authors -> mps / interpellations
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

-- 4. Restore speeches -> mps
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'speeches') THEN
        ALTER TABLE speeches ADD CONSTRAINT "speeches_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Restore asset_declarations -> mps
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asset_declarations') THEN
        ALTER TABLE asset_declarations ADD CONSTRAINT "asset_declarations_mp_id_fkey" 
            FOREIGN KEY (mp_id) REFERENCES mps(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. FIX UNIQUE CONSTRAINT ON VOTES
-- Drop old
ALTER TABLE votes DROP CONSTRAINT IF EXISTS "votes_sitting_voting_number_key";
-- Add new (composite with term)
DROP INDEX IF EXISTS votes_term_sitting_voting_idx;
CREATE UNIQUE INDEX votes_term_sitting_voting_idx ON votes(term, sitting, voting_number);

COMMIT;
