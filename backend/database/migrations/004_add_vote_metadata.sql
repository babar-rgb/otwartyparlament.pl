-- Migration 004: Add metadata columns to votes table
-- Necessary for Latarnik Wyborczy and AI-driven analysis

ALTER TABLE votes ADD COLUMN IF NOT EXISTS importance INTEGER DEFAULT 5;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS topic VARCHAR(255);
ALTER TABLE votes ADD COLUMN IF NOT EXISTS kind VARCHAR(50);

-- Index for performance in Latarnik
CREATE INDEX IF NOT EXISTS idx_votes_importance ON votes(importance DESC);
CREATE INDEX IF NOT EXISTS idx_votes_topic ON votes(topic);
