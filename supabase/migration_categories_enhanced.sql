-- Day 1 Enhancement: Professional-Grade Normalization
-- Phase 2: Deep cleanup and optimization

-- Step 1: Merge remaining duplicates
UPDATE votes SET category = 'INNE' WHERE category IN ('Inne', 'inne');
UPDATE votes SET category = 'GOSPODARKA' WHERE category IN ('Ekonomia', 'ekonomia');

-- Step 2: Consolidate similar categories
-- "Sprawozdania" is too broad - let's keep it for now but mark for review
-- UPDATE votes SET category = 'PROCEDURALNE' WHERE category = 'Sprawozdania';

-- Step 3: Create clean category enum (for future constraint)
CREATE TYPE vote_category_enum AS ENUM (
  'GOSPODARKA',
  'SPRAWIEDLIWOŚĆ',
  'ZDROWIE',
  'ROLNICTWO',
  'OBRONNOŚĆ',
  'EDUKACJA',
  'ENERGETYKA',
  'INFRASTRUKTURA',
  'POLITYKA SPOŁECZNA',
  'SPRAWY ZAGRANICZNE',
  'KULTURA',
  'SYMBOLICZNE',
  'PERSONALNE/PROCEDURALNE',
  'INNE'
);

-- Note: Can't directly convert existing column to enum without data loss
-- This enum is for future use and validation

-- Step 4: Add category index for fast filtering
CREATE INDEX IF NOT EXISTS idx_votes_category ON votes(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_category_term ON votes(category, term) WHERE category IS NOT NULL;

-- Step 5: Add statistics view
CREATE OR REPLACE VIEW vote_category_stats AS
SELECT 
  category,
  term,
  COUNT(*) as vote_count,
  COUNT(DISTINCT sitting) as sittings,
  MIN(date) as first_vote,
  MAX(date) as last_vote,
  ROUND(AVG(CASE WHEN verdict = 'PRZYJĘTO' THEN 1 ELSE 0 END) * 100, 1) as pass_rate
FROM votes
WHERE category IS NOT NULL
GROUP BY category, term
ORDER BY term DESC, vote_count DESC;

-- Step 6: Verify final state
SELECT 
  category,
  count(*) as votes,
  ROUND(100.0 * count(*) / SUM(count(*)) OVER (), 1) as percent
FROM votes
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count(*) DESC;
