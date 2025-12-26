-- Migration: Update Social accounts for Niezrzeszeni, Republikanie, Razem
-- Date: 2025-12-26

UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/poslanka.izabela.bodnar/", "twitter": "https://x.com/BodnarIzabela"}'::jsonb WHERE name = 'Izabela Bodnar' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/PolaMatysiakRazem/", "twitter": "https://x.com/PolaMatysiak?lang=en"}'::jsonb WHERE name = 'Paulina Matysiak' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/tomasz.rzymkowski/", "twitter": "https://x.com/TRzymkowski"}'::jsonb WHERE name = 'Tomasz Rzymkowski' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/Jaroslaw.Sachajko.K15/", "twitter": "https://x.com/jsachajko?lang=en"}'::jsonb WHERE name = 'Jarosław Sachajko' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/marekjakubiak2/?locale=pl_PL"}'::jsonb WHERE name = 'Marek Jakubiak' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/kukizpawel/?locale=pl_PL", "twitter": "https://x.com/pkukiz?lang=en"}'::jsonb WHERE name = 'Paweł Kukiz' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/zandberg.razem/", "twitter": "https://x.com/ZandbergRAZEM"}'::jsonb WHERE name = 'Adrian Zandberg' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/maciejkoniecznyrazem/?locale=pl_PL", "twitter": "https://x.com/_mkonieczny?lang=en"}'::jsonb WHERE name = 'Maciej Konieczny' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/mmzawisza/?locale=pl_PL", "twitter": "https://x.com/mmzawisza?lang=en"}'::jsonb WHERE name = 'Marcelina Zawisza' AND term = 10;
UPDATE mps SET contact_info = COALESCE(contact_info, '{}'::jsonb) || '{"facebook": "https://www.facebook.com/Marta.Stozek.Razem/", "twitter": "https://x.com/MartaStozek"}'::jsonb WHERE name = 'Marta Stożek' AND term = 10;