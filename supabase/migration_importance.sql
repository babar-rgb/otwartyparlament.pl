-- Migration: Add Importance Scoring to Votes Table
-- This enables automatic classification of "Key Votes" vs "Routine" votes

-- Add importance_score column (0-100 scale)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS importance_score INTEGER DEFAULT 0;

-- Add is_key_vote flag (true if score > 60)
ALTER TABLE votes ADD COLUMN IF NOT EXISTS is_key_vote BOOLEAN DEFAULT false;

-- Add index for filtering by key votes
CREATE INDEX IF NOT EXISTS idx_votes_is_key_vote ON votes(is_key_vote);
CREATE INDEX IF NOT EXISTS idx_votes_importance_score ON votes(importance_score DESC);

-- Add comment explaining the scoring system
COMMENT ON COLUMN votes.importance_score IS 'Automatic importance score (0-100) based on keywords and controversy. Higher = more important.';
COMMENT ON COLUMN votes.is_key_vote IS 'True if importance_score > 60. Indicates high-impact or controversial legislation.';
