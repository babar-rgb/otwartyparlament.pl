-- Migration: 003_add_stats.sql
-- Description: Add statistics columns to MPs table
-- Author: Antigravity

ALTER TABLE mps ADD COLUMN IF NOT EXISTS stats_attendance FLOAT DEFAULT 0.0;
ALTER TABLE mps ADD COLUMN IF NOT EXISTS stats_rebellion INTEGER DEFAULT 0;

-- Optional: Add index for sorting performance
CREATE INDEX IF NOT EXISTS idx_mps_stats_attendance ON mps(stats_attendance);
CREATE INDEX IF NOT EXISTS idx_mps_stats_rebellion ON mps(stats_rebellion);
