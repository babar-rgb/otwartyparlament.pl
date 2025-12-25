-- Create index to speed up title-based lookups
CREATE INDEX IF NOT EXISTS idx_votes_title_clean ON votes(title_clean);

-- Create a computed function that can be used in Supabase queries
-- returns true if this is effectively the last vote of its kind in the sitting
CREATE OR REPLACE FUNCTION is_final_vote(vote_row votes)
RETURNS boolean AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM votes v2
    WHERE v2.term = vote_row.term
      AND v2.sitting = vote_row.sitting
      AND v2.title_clean = vote_row.title_clean
      AND v2.voting_number > vote_row.voting_number
  );
$$ LANGUAGE sql STABLE;
