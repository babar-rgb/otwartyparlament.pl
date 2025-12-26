-- Migration: Update Final 45 PiS Social accounts (Multi-platform)
-- Date: 2025-12-26

UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/KmitaLukasz/", "instagram": "https://www.instagram.com/lukasz_kmita/"}'::jsonb WHERE name = 'Łukasz Kmita' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"twitter": "https://x.com/jlichocka", "facebook": "https://www.facebook.com/joanna.lichocka/", "instagram": "https://www.instagram.com/joanna.lichocka/"}'::jsonb WHERE name = 'Joanna Lichocka' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/p/Katarzyna-Czochara-100057722543178/"}'::jsonb WHERE name = 'Katarzyna Czochara' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"website": "http://www.kazimierzgolojuch.pl"}'::jsonb WHERE name = 'Kazimierz Gołojuch' AND term = 10;