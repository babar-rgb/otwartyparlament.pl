-- Migration: Update Social accounts for Konfederacja KP (Manual Correction)
-- Date: 2025-12-26

UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/p/Andrzej-Zapa%C5%82owski-100063811793152/", "twitter": "https://x.com/A_Zapalowski"}'::jsonb WHERE name = 'Andrzej Zapałowski' AND term = 10;

UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/RomanFritzSejmRP/", "twitter": "https://x.com/Roman_Korona"}'::jsonb WHERE name = 'Roman Fritz' AND term = 10;

UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/SlawomirZawislakPoselNaszejZiemi/", "twitter": "https://x.com/SlawZawislak"}'::jsonb WHERE name = 'Sławomir Zawiślak' AND term = 10;

UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/WlodzimierzSkalik/", "twitter": "https://x.com/Wlodek_Skalik"}'::jsonb WHERE name = 'Włodzimierz Skalik' AND term = 10;