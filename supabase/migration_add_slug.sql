-- Add slug column to mps table
ALTER TABLE mps ADD COLUMN IF NOT EXISTS slug text;

-- Create a unique index on the slug column
-- We use a unique index instead of a constraint to allow potentially null values initially, 
-- though we aim to populate them all. It also speeds up lookups.
CREATE UNIQUE INDEX IF NOT EXISTS idx_mps_slug ON mps (slug);

-- Comment
COMMENT ON COLUMN mps.slug IS 'URL-friendly identifier generated from name (e.g. adam-lubonski)';
