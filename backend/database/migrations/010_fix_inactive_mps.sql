-- Migration: Fix active status for Term 10 MPs
-- Date: 2025-12-26
-- Updates 'active' column. 
-- True = MPs with at least one active club membership (to_date IS NULL) in term 10.
-- False = MPs with no active memberships (expired mandate, etc.).

UPDATE mps
SET active = CASE 
    WHEN EXISTS (
        SELECT 1 
        FROM club_memberships cm 
        WHERE cm.mp_id = mps.id 
          AND cm.term = 10 
          AND cm.to_date IS NULL
    ) THEN true
    ELSE false
END
WHERE term = 10;
