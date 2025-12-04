-- Add declarations column to mps table
ALTER TABLE mps ADD COLUMN IF NOT EXISTS declarations JSONB DEFAULT '[]'::JSONB;

-- Comment on column
COMMENT ON COLUMN mps.declarations IS 'List of asset declarations (label, url)';
