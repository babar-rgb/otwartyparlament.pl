-- 1. MPs Table (poslowie)

-- Ensure term column exists
alter table mps 
add column if not exists term int not null default 10;

-- Ensure api_id column exists (Migrating from 'id' being the API ID)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mps' AND column_name = 'api_id') THEN 
        ALTER TABLE mps ADD COLUMN api_id INT;
        -- Populate api_id from id for existing rows (Term 10)
        UPDATE mps SET api_id = id WHERE api_id IS NULL;
        ALTER TABLE mps ALTER COLUMN api_id SET NOT NULL;
    END IF; 
END $$;

-- Drop old constraints on api_id if they technically existed (safeguard)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mps_api_id_key') THEN 
        ALTER TABLE mps DROP CONSTRAINT mps_api_id_key; 
    END IF; 
END $$;

-- Create composite unique index
-- This allows (api_id=1, term=9) and (api_id=1, term=10) to coexist
create unique index if not exists idx_mps_api_id_term on mps(api_id, term);


-- 2. Votes Table (glosowania)
alter table votes
add column if not exists term int not null default 10;

create index if not exists idx_votes_term on votes(term);


-- 3. Euro Tables (for consistency)
alter table euro_meps
add column if not exists term int not null default 10;

alter table euro_votes
add column if not exists term int not null default 10;
