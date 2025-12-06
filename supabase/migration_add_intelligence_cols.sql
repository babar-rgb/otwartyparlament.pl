-- Add Intelligence Columns
ALTER TABLE votes ADD COLUMN IF NOT EXISTS importance_score float;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS topic_tag text;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS semantic_weight float;

-- Index for sorting by importance
CREATE INDEX IF NOT EXISTS idx_votes_importance ON votes (importance_score DESC);

-- Comment
COMMENT ON COLUMN votes.importance_score IS 'AI-calculated importance (0-100)';
COMMENT ON COLUMN votes.topic_tag IS 'AI-detected topic (e.g. Zdrowie)';
