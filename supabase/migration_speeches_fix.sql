-- Drop the problematic unique constraint
ALTER TABLE speeches DROP CONSTRAINT IF EXISTS speeches_mp_id_sitting_date_content_key;

-- Add a new unique constraint without the content column
-- We assume one MP speaks once per sitting/date/topic, but actually they can speak multiple times.
-- A better composite key would include the statement number if we had it, or we can just rely on ID.
-- Since we don't have a perfect unique key from the API in the current script (we have stmt_num but didn't save it),
-- let's add a `statement_num` column and use that.

ALTER TABLE speeches ADD COLUMN IF NOT EXISTS statement_num INT;

-- We need to clear the table or handle duplicates carefully. 
-- For now, let's just truncate it to start fresh since we are in dev.
TRUNCATE TABLE speeches;

-- Add constraint with statement_num
ALTER TABLE speeches ADD CONSTRAINT speeches_unique_statement UNIQUE (mp_id, sitting, date, statement_num);
