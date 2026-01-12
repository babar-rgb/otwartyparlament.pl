-- Migration: 006_sitting_summaries
-- Purpose: Store AI-generated summaries for each sitting

CREATE TABLE IF NOT EXISTS sitting_summaries (
    id SERIAL PRIMARY KEY,
    term INTEGER NOT NULL,
    sitting_number INTEGER NOT NULL,
    summary_md TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(term, sitting_number)
);

-- Index for fast lookup of the latest sitting
CREATE INDEX IF NOT EXISTS idx_sitting_summaries_term_sitting ON sitting_summaries(term DESC, sitting_number DESC);
