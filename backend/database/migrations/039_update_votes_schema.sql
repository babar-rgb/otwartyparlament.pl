-- Rename title to title_raw if exists, else add it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'votes' AND column_name = 'title') THEN
        ALTER TABLE votes RENAME COLUMN title TO title_raw;
    ELSE
        ALTER TABLE votes ADD COLUMN IF NOT EXISTS title_raw VARCHAR;
    END IF;
END $$;

ALTER TABLE votes ADD COLUMN IF NOT EXISTS title_clean VARCHAR;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS verdict VARCHAR;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS details_json JSONB;
