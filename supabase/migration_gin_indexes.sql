-- GIN Indexes for Full-Text Search
-- Run this to add optimized search indexes

-- 1. Interpellations - content search
DO $$
BEGIN
    -- Add tsvector column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'interpellations' AND column_name = 'content_tsv') THEN
        ALTER TABLE interpellations ADD COLUMN content_tsv tsvector
            GENERATED ALWAYS AS (to_tsvector('polish', coalesce(content, '') || ' ' || coalesce(title, ''))) STORED;
    END IF;
END $$;

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_interpellations_content_gin 
ON interpellations USING gin(content_tsv);

-- 2. Processes - description search
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'processes' AND column_name = 'description_tsv') THEN
        ALTER TABLE processes ADD COLUMN description_tsv tsvector
            GENERATED ALWAYS AS (to_tsvector('polish', coalesce(description, '') || ' ' || coalesce(title, ''))) STORED;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_processes_description_gin 
ON processes USING gin(description_tsv);

-- 3. Add additional performance indexes
CREATE INDEX IF NOT EXISTS idx_interpellations_mp 
ON interpellation_authors(mp_id);

CREATE INDEX IF NOT EXISTS idx_interpellations_date 
ON interpellations(receipt_date DESC);

-- 4. Verify indexes
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%gin%' OR indexname LIKE '%tsv%';
