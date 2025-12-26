-- Migration: Update social media links for confirmed Konfederacja MPs
-- Date: 2025-12-26
-- Description: Populates contact_info with verified Twitter and Facebook URLs

-- Krzysztof Bosak
UPDATE mps 
SET contact_info = contact_info || '{"twitter": "https://twitter.com/krzysztofbosak", "facebook": "https://www.facebook.com/krzysztofbosak"}'::jsonb 
WHERE name = 'Krzysztof Bosak';

-- Sławomir Mentzen
UPDATE mps 
SET contact_info = contact_info || '{"twitter": "https://twitter.com/SlawomirMentzen", "facebook": "https://www.facebook.com/slawomirmentzen"}'::jsonb 
WHERE name = 'Sławomir Mentzen';

-- Konrad Berkowicz
UPDATE mps 
SET contact_info = contact_info || '{"twitter": "https://twitter.com/KonradBerkowicz", "facebook": "https://www.facebook.com/KonradBerkowiczOficjalny"}'::jsonb 
WHERE name = 'Konrad Berkowicz';

-- Grzegorz Płaczek
UPDATE mps 
SET contact_info = contact_info || '{"twitter": "https://twitter.com/placzekgrzegorz", "facebook": "https://www.facebook.com/GrzegorzPlaczekOficjalny"}'::jsonb 
WHERE name = 'Grzegorz Płaczek';

-- Przemysław Wipler
UPDATE mps 
SET contact_info = contact_info || '{"twitter": "https://twitter.com/PrzemyslawWipler", "facebook": "https://www.facebook.com/PrzemyslawWipler"}'::jsonb 
WHERE name = 'Przemysław Wipler';

-- Bartłomiej Pejo
UPDATE mps 
SET contact_info = contact_info || '{"twitter": "https://twitter.com/bartlomiejpejo", "facebook": "https://www.facebook.com/BartlomiejPejo"}'::jsonb 
WHERE name = 'Bartłomiej Pejo';

-- Krzysztof Mulawa
UPDATE mps 
SET contact_info = contact_info || '{"facebook": "https://www.facebook.com/KrzysztofMulawa"}'::jsonb 
WHERE name = 'Krzysztof Mulawa';

-- Witold Tumanowicz
UPDATE mps 
SET contact_info = contact_info || '{"facebook": "https://www.facebook.com/witold.tumanowicz"}'::jsonb 
WHERE name = 'Witold Tumanowicz';

-- Krzysztof Szymański
UPDATE mps 
SET contact_info = contact_info || '{"facebook": "https://www.facebook.com/KSzymanskiKonfederacja"}'::jsonb 
WHERE name = 'Krzysztof Szymański';

-- Michał Wawer
UPDATE mps 
SET contact_info = contact_info || '{"facebook": "https://www.facebook.com/MichalWawerRN"}'::jsonb 
WHERE name = 'Michał Wawer';

-- Note for Michał Połuboczek and others: 
-- Data omitted as official personal verified links were not explicitly found in the automated search.
-- Adhering to "safe and no fake data" policy.
