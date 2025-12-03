-- Create vote_analyses table
CREATE TABLE IF NOT EXISTS vote_analyses (
    vote_id INTEGER PRIMARY KEY REFERENCES votes(id) ON DELETE CASCADE,
    summary TEXT,
    pros JSONB, -- Array of strings
    cons JSONB, -- Array of strings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for performance (though PK is already indexed)
-- CREATE INDEX IF NOT EXISTS idx_vote_analyses_vote_id ON vote_analyses(vote_id);
