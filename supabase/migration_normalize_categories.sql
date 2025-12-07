-- Day 1 Quick Win: Category Normalization
-- Fix: 22 chaotic categories → 12 clean categories

-- Step 1: Normalize VOTES table categories
UPDATE votes SET category = 'GOSPODARKA' WHERE category IN ('Gospodarka', 'gospodarka');
UPDATE votes SET category = 'SPRAWIEDLIWOŚĆ' WHERE category IN ('Sądownictwo', 'sądownictwo', 'SPRAWIEDLIWOŚĆ');
UPDATE votes SET category = 'ZDROWIE' WHERE category IN ('Zdrowie', 'zdrowie', 'ZDROWIE');
UPDATE votes SET category = 'OBRONNOŚĆ' WHERE category IN ('Obronność', 'obronność', 'OBRONNOŚĆ');
UPDATE votes SET category = 'ROLNICTWO' WHERE category IN ('Rolnictwo', 'rolnictwo', 'ROLNICTWO');
UPDATE votes SET category = 'EDUKACJA' WHERE category IN ('Edukacja', 'edukacja', 'EDUKACJA');
UPDATE votes SET category = 'ENERGETYKA' WHERE category IN ('Energetyka', 'energetyka', 'ENERGETYKA');
UPDATE votes SET category = 'INFRASTRUKTURA' WHERE category IN ('Infrastruktura', 'infrastruktura', 'INFRASTRUKTURA');
UPDATE votes SET category = 'POLITYKA SPOŁECZNA' WHERE category IN ('Polityka Społeczna', 'polityka społeczna', 'POLITYKA SPOŁECZNA');
UPDATE votes SET category = 'SPRAWY ZAGRANICZNE' WHERE category IN ('Sprawy Zagraniczne', 'sprawy zagraniczne', 'SPRAWY ZAGRANICZNE');
UPDATE votes SET category = 'KULTURA' WHERE category IN ('Kultura', 'kultura', 'KULTURA');

-- Step 2: Consolidate "Sprawozdania" into more specific categories
-- (Keep as is for now - it's a valid procedural category)

-- Step 3: Verify result
SELECT category, count(*) as count 
FROM votes 
GROUP BY category 
ORDER BY count DESC;

-- Expected: ~12-15 clean categories (uppercase, no duplicates)
