-- Add voting_number to votes
ALTER TABLE votes ADD COLUMN IF NOT EXISTS voting_number INTEGER;
