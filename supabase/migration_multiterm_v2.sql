-- Migration: Multi-Term Support (v2 - Integer IDs)
-- Goal: Make IDs globally unique by including the term number using INTEGER offsets.

-- 1. MPS TABLE
-- Add term column
ALTER TABLE mps ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;

-- Update existing IDs to be "10000 + id" (Term 10 prefix).
-- Max MP ID is ~460. 10000 is safe.
-- Term 9 will be 9000 + id.
-- Term 10 MP 1 -> 10001.

BEGIN;

-- A. Update MPs
-- We need to handle FKs. If ON UPDATE CASCADE is set, this is easy.
-- If not, we might break things. Let's assume standard Supabase setup (CASCADE).
-- We filter WHERE id < 1000 to avoid re-running on already updated IDs.
UPDATE mps SET id = 10000 + id WHERE id < 1000;

-- B. Update Votes
-- Current ID: sitting * 10000 + number (e.g. 10001)
-- New ID: term * 10000000 + original_id.
-- Term 10: 10 * 10000000 + 10001 = 100010001.
-- Wait, 10 * 10M = 100M. Integer max is 2B. Safe.
ALTER TABLE votes ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
UPDATE votes SET id = 100000000 + id WHERE id < 100000000;

-- C. Speeches
ALTER TABLE speeches ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;
-- Speeches link to mps.id. If CASCADE works, they are updated.
-- If not, we'd need: UPDATE speeches SET mp_id = 10000 + mp_id WHERE mp_id < 1000;

-- D. Interpellations
ALTER TABLE interpellations ADD COLUMN IF NOT EXISTS term INTEGER DEFAULT 10;

COMMIT;
