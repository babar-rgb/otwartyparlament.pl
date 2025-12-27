-- Migration: Add indexes for common queries
-- Date: 2025-12-26

-- MPS Table
CREATE INDEX IF NOT EXISTS idx_mps_party ON mps(party);
CREATE INDEX IF NOT EXISTS idx_mps_active ON mps(active);
CREATE INDEX IF NOT EXISTS idx_mps_term ON mps(term);
-- Case-insensitive name search index
CREATE INDEX IF NOT EXISTS idx_mps_name_lower ON mps(lower(name));

-- VOTES Table
CREATE INDEX IF NOT EXISTS idx_votes_date ON votes(date);
-- Text search index for titles (simple pattern matching)
CREATE INDEX IF NOT EXISTS idx_votes_title_clean_lower ON votes(lower(title_clean));

-- VOTE_RESULTS Table (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_vote_results_mp_id ON vote_results(mp_id);
CREATE INDEX IF NOT EXISTS idx_vote_results_vote_id ON vote_results(vote_id);
-- Composite index for specific MP vote lookup
CREATE INDEX IF NOT EXISTS idx_vote_results_mp_vote ON vote_results(mp_id, vote_id);
