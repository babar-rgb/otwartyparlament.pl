-- Seed parties data
INSERT INTO parties (id, name, color, logo_url) VALUES
('PiS', 'Prawo i Sprawiedliwość', '#0355BF', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Prawo_i_Sprawiedliwo%C5%9B%C4%87_logo.svg/512px-Prawo_i_Sprawiedliwo%C5%9B%C4%87_logo.svg.png'),
('KO', 'Koalicja Obywatelska', '#F26D21', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Koalicja_Obywatelska_logo.svg/512px-Koalicja_Obywatelska_logo.svg.png'),
('Polska2050', 'Polska 2050', '#F2D64B', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Polska_2050_Szymona_Ho%C5%82owni_logo.svg/512px-Polska_2050_Szymona_Ho%C5%82owni_logo.svg.png'),
('PSL', 'PSL (Trzecia Droga)', '#157347', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Polskie_Stronnictwo_Ludowe_Logo.svg/512px-Polskie_Stronnictwo_Ludowe_Logo.svg.png'),
('Lewica', 'Lewica', '#B22222', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Nowa_Lewica_logo.svg/512px-Nowa_Lewica_logo.svg.png'),
('Razem', 'Partia Razem', '#9333ea', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Partia_Razem_logo.svg/512px-Partia_Razem_logo.svg.png'),
('Konfederacja', 'Konfederacja', '#0a1628', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Konfederacja_Wolno%C5%9B%C4%87_i_Niepodleg%C5%82o%C5%9B%C4%87_logo.svg/512px-Konfederacja_Wolno%C5%9B%C4%87_i_Niepodleg%C5%82o%C5%9B%C4%87_logo.svg.png'),
('Konfederacja_KP', 'Konfederacja Korony Polskiej', '#842029', 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Confederation_of_the_Polish_Crown_logo.png'),
('Republikanie', 'Republikanie', '#1e3a8a', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_Partii_Republika%C5%84skiej.svg/512px-Logo_Partii_Republika%C5%84skiej.svg.png'),
('PS', 'Suwerenna Polska', '#ef4444', 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Suwerenna_Polska_Logo.png'),
('Kukiz15', 'Kukiz''15', '#111827', 'https://upload.wikimedia.org/wikipedia/commons/b/b3/KUKIZ15.png'),
('niez.', 'Niezrzeszeni', '#6B7280', '')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, color = EXCLUDED.color, logo_url = EXCLUDED.logo_url;
