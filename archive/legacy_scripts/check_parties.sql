-- Query to check all unique party/club names in the mps table
SELECT DISTINCT party, COUNT(*) as count
FROM mps
WHERE active = true
GROUP BY party
ORDER BY count DESC;
