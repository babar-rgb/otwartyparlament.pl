-- Add missing columns to interpellations
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS last_modified TIMESTAMP;
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS raw_data JSONB;
