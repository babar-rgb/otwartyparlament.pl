-- Migration: 005_content_enrichment
-- Purpose: Add columns for official Sejm links

ALTER TABLE mps ADD COLUMN IF NOT EXISTS link_sejm TEXT;
ALTER TABLE votes ADD COLUMN IF NOT EXISTS link_sejm TEXT;
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS link_sejm TEXT;
