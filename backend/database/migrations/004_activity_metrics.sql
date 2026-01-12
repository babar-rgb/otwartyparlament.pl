-- Migration: Activity Metrics
-- 1. Create bill_authors table (Many-to-Many: Bill <-> MP)
CREATE TABLE IF NOT EXISTS bill_authors (
    bill_process_id TEXT REFERENCES bills(process_id) ON DELETE CASCADE,
    mp_id INTEGER REFERENCES mps(id) ON DELETE CASCADE,
    PRIMARY KEY (bill_process_id, mp_id)
);

-- 2. Add stats columns to mps table
ALTER TABLE mps ADD COLUMN IF NOT EXISTS stats_bills_count INTEGER DEFAULT 0;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS stats_speeches_count INTEGER DEFAULT 0;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS stats_interpellations_count INTEGER DEFAULT 0;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS stats_activity_score INTEGER DEFAULT 0;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_authors_mp_id ON bill_authors(mp_id);
CREATE INDEX IF NOT EXISTS idx_mps_activity_score ON mps(stats_activity_score DESC);
