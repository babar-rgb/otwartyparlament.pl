-- Migration: Update Twitter/X links for KO MPs
-- Date: 2025-12-26
-- Enriches existing contact_info with new Twitter links

UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/AdamKrzemo"}'::jsonb WHERE name = 'Adam Krzemiński';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/adamSzlapka"}'::jsonb WHERE name = 'Adam Szłapka';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/adrian_witczak"}'::jsonb WHERE name = 'Adrian Witczak';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/agnieszkahana"}'::jsonb WHERE name = 'Agnieszka Hanajczyk';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/AGajewska"}'::jsonb WHERE name = 'Aleksandra Gajewska';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/Ala_Luczak"}'::jsonb WHERE name = 'Alicja Łuczak';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/anna_sobolak"}'::jsonb WHERE name = 'Anna Sobolak';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/ArkadiuszMyrcha"}'::jsonb WHERE name = 'Arkadiusz Myrcha';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/BDolniak"}'::jsonb WHERE name = 'Barbara Dolniak';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/Grygorcewicz_B"}'::jsonb WHERE name = 'Barbara Grygorcewicz';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/barbaraanowacka"}'::jsonb WHERE name = 'Barbara Nowacka';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/BartoszZawieja"}'::jsonb WHERE name = 'Bartosz Zawieja';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/Woloszanski2023"}'::jsonb WHERE name = 'Bogusław Wołoszański';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/bozenalisowska"}'::jsonb WHERE name = 'Bożena Lisowska';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/DorotaLoboda"}'::jsonb WHERE name = 'Dorota Łoboda';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/DorotaMarek_"}'::jsonb WHERE name = 'Dorota Marek';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/DorotaNiedziela"}'::jsonb WHERE name = 'Dorota Niedziela';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/Kolodziej_Ewaa"}'::jsonb WHERE name = 'Ewa Kołodziej';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/f_sterczewski"}'::jsonb WHERE name = 'Franciszek Sterczewski';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/Napieralski_G"}'::jsonb WHERE name = 'Grzegorz Napieralski';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/iwonahartwich"}'::jsonb WHERE name = 'Iwona Hartwich';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/IwonaKarolewska"}'::jsonb WHERE name = 'Iwona Karolewska';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/Leszczyna"}'::jsonb WHERE name = 'Izabela Leszczyna';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/jacek_karnowski"}'::jsonb WHERE name = 'Jacek Karnowski';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/joannakluzik"}'::jsonb WHERE name = 'Joanna Kluzik-Rostkowska';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/KLubnauer"}'::jsonb WHERE name = 'Katarzyna Lubnauer';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/JachiraKlaudia"}'::jsonb WHERE name = 'Klaudia Jachira';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/LasekMaciej"}'::jsonb WHERE name = 'Maciej Lasek';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/marek_hok"}'::jsonb WHERE name = 'Marek Hok';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/MWielichowska"}'::jsonb WHERE name = 'Monika Wielichowska';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/piotr_borys"}'::jsonb WHERE name = 'Piotr Borys';
UPDATE mps SET contact_info = contact_info || '{"twitter": "https://x.com/TomaszSiemoniak"}'::jsonb WHERE name = 'Tomasz Siemoniak';