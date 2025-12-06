-- Add seat_number to mps table
ALTER TABLE mps 
ADD COLUMN IF NOT EXISTS seat_number INTEGER DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN mps.seat_number IS 'Physical seat number in the Sejm Plenary Hall (Digital Twin mapping)';
