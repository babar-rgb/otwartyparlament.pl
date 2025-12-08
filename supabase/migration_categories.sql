-- Professional Vote Categorization System
-- Migration Script: Create Category Tables
-- 
-- SAFE: Creates new tables only, does not modify existing data
-- ROLLBACK: DROP TABLE vote_categories, categories CASCADE;

-- ============================================================================
-- TABLE 1: categories - Hierarchical category taxonomy
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name_pl VARCHAR(100) NOT NULL,
    name_citizen VARCHAR(100),
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
    icon VARCHAR(50),
    color VARCHAR(20),
    keywords TEXT[] DEFAULT '{}',
    weight INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: vote_categories - Many-to-many assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS vote_categories (
    vote_id INTEGER REFERENCES votes(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    is_primary BOOLEAN DEFAULT FALSE,
    assigned_by VARCHAR(20) DEFAULT 'rule' CHECK (assigned_by IN ('rule', 'ai', 'manual')),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (vote_id, category_id)
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_vote_categories_vote ON vote_categories(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_categories_category ON vote_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_vote_categories_primary ON vote_categories(is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_level ON categories(level);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- SEED DATA: Level 1 - Domains (7 main categories)
-- ============================================================================
INSERT INTO categories (slug, name_pl, name_citizen, level, icon, color, display_order, keywords) VALUES
('gospodarka', 'Gospodarka', 'Pieniądze i praca', 1, 'Briefcase', 'blue', 1, 
 ARRAY['gospodarka', 'ekonomia', 'finanse', 'podatki', 'budżet', 'przedsiębiorczość', 'biznes', 'handel']),
('spoleczenstwo', 'Społeczeństwo', 'Zdrowie i rodzina', 1, 'Heart', 'green', 2,
 ARRAY['zdrowie', 'edukacja', 'rodzina', 'dzieci', 'emerytura', 'renta', 'pomoc społeczna', 'opieka']),
('panstwo', 'Państwo', 'Prawo i bezpieczeństwo', 1, 'Shield', 'red', 3,
 ARRAY['sąd', 'prawo', 'bezpieczeństwo', 'policja', 'prokuratura', 'wymiar sprawiedliwości', 'konstytucja']),
('obronnosc', 'Obronność', 'Wojsko i granice', 1, 'Sword', 'slate', 4,
 ARRAY['wojsko', 'armia', 'obronność', 'siły zbrojne', 'NATO', 'granica', 'straż graniczna']),
('srodowisko', 'Środowisko', 'Ekologia i klimat', 1, 'Leaf', 'emerald', 5,
 ARRAY['środowisko', 'ekologia', 'klimat', 'energia', 'odpady', 'ochrona przyrody', 'lasy']),
('infrastruktura', 'Infrastruktura', 'Transport i mieszkania', 1, 'Building', 'orange', 6,
 ARRAY['transport', 'drogi', 'kolej', 'mieszkania', 'budownictwo', 'infrastruktura']),
('kultura', 'Kultura i media', 'Kultura i media', 1, 'Music', 'purple', 7,
 ARRAY['kultura', 'media', 'sztuka', 'dziedzictwo', 'sport', 'turystyka'])
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED DATA: Level 2 - Areas (under each domain)
-- ============================================================================

-- GOSPODARKA subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'podatki', 'Podatki', 'Podatki i opłaty', 2, 'blue', 1,
       ARRAY['podatek', 'pit', 'cit', 'vat', 'akcyza', 'danina', 'opłata', 'podatkowy']
FROM categories WHERE slug = 'gospodarka'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'przedsiebiorczosc', 'Przedsiębiorczość', 'Firmy i biznes', 2, 'blue', 2,
       ARRAY['przedsiębiorczość', 'firma', 'działalność gospodarcza', 'spółka', 'biznes', 'mśp']
FROM categories WHERE slug = 'gospodarka'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'praca', 'Praca', 'Praca i zatrudnienie', 2, 'blue', 3,
       ARRAY['praca', 'zatrudnienie', 'pracownik', 'pracodawca', 'płaca', 'minimalna', 'kodeks pracy', 'umowa']
FROM categories WHERE slug = 'gospodarka'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'budzet', 'Budżet', 'Budżet państwa', 2, 'blue', 4,
       ARRAY['budżet', 'budżetowa', 'wydatki', 'dochody', 'deficyt', 'finanse publiczne']
FROM categories WHERE slug = 'gospodarka'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'bankowosc', 'Bankowość', 'Banki i finanse', 2, 'blue', 5,
       ARRAY['bank', 'bankowy', 'kredyt', 'pożyczka', 'nbp', 'stopy procentowe', 'hipoteka']
FROM categories WHERE slug = 'gospodarka'
ON CONFLICT (slug) DO NOTHING;

-- SPOŁECZEŃSTWO subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'zdrowie', 'Zdrowie', 'Służba zdrowia', 2, 'green', 1,
       ARRAY['zdrowie', 'lekarz', 'szpital', 'nfz', 'leczenie', 'pacjent', 'medyczny', 'opieka zdrowotna']
FROM categories WHERE slug = 'spoleczenstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'edukacja', 'Edukacja', 'Szkoły i uczelnie', 2, 'green', 2,
       ARRAY['edukacja', 'szkoła', 'nauczyciel', 'uczeń', 'student', 'uczelnia', 'oświata', 'karta nauczyciela']
FROM categories WHERE slug = 'spoleczenstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'emerytury', 'Emerytury', 'Emerytury i renty', 2, 'green', 3,
       ARRAY['emerytura', 'renta', 'zus', 'emeryt', 'świadczenie', 'waloryzacja', 'trzynastka', 'czternastka']
FROM categories WHERE slug = 'spoleczenstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'rodzina', 'Rodzina', 'Rodzina i dzieci', 2, 'green', 4,
       ARRAY['rodzina', 'dziecko', 'rodzic', '500+', '800+', 'urlop macierzyński', 'żłobek', 'przedszkole']
FROM categories WHERE slug = 'spoleczenstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'pomoc-spoleczna', 'Pomoc społeczna', 'Wsparcie socjalne', 2, 'green', 5,
       ARRAY['pomoc społeczna', 'zasiłek', 'świadczenie', 'wsparcie', 'niepełnosprawność', 'opieka']
FROM categories WHERE slug = 'spoleczenstwo'
ON CONFLICT (slug) DO NOTHING;

-- PAŃSTWO subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'sadownictwo', 'Sądownictwo', 'Sądy i trybunały', 2, 'red', 1,
       ARRAY['sąd', 'sędzia', 'trybunał', 'krs', 'sąd najwyższy', 'wymiar sprawiedliwości']
FROM categories WHERE slug = 'panstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'prawo-karne', 'Prawo karne', 'Prawo karne', 2, 'red', 2,
       ARRAY['kodeks karny', 'przestępstwo', 'kara', 'więzienie', 'wyrok', 'prokuratura']
FROM categories WHERE slug = 'panstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'prawo-cywilne', 'Prawo cywilne', 'Prawo cywilne', 2, 'red', 3,
       ARRAY['kodeks cywilny', 'umowa', 'własność', 'spadek', 'rozwód']
FROM categories WHERE slug = 'panstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'bezpieczenstwo', 'Bezpieczeństwo', 'Policja i służby', 2, 'red', 4,
       ARRAY['policja', 'bezpieczeństwo', 'abw', 'służby', 'bezpieczeństwo wewnętrzne']
FROM categories WHERE slug = 'panstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'samorzad', 'Samorząd', 'Samorząd lokalny', 2, 'red', 5,
       ARRAY['samorząd', 'gmina', 'powiat', 'województwo', 'wójt', 'burmistrz', 'prezydent miasta']
FROM categories WHERE slug = 'panstwo'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'wybory', 'Wybory', 'Wybory i referenda', 2, 'red', 6,
       ARRAY['wybory', 'głosowanie', 'referendum', 'ordynacja', 'pkw', 'kodeks wyborczy']
FROM categories WHERE slug = 'panstwo'
ON CONFLICT (slug) DO NOTHING;

-- OBRONNOŚĆ subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'wojsko', 'Wojsko', 'Siły Zbrojne', 2, 'slate', 1,
       ARRAY['wojsko', 'żołnierz', 'siły zbrojne', 'armia', 'wojskowy', 'służba wojskowa']
FROM categories WHERE slug = 'obronnosc'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'granice', 'Granice', 'Ochrona granic', 2, 'slate', 2,
       ARRAY['granica', 'straż graniczna', 'graniczny', 'przejście graniczne']
FROM categories WHERE slug = 'obronnosc'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'nato-ue', 'NATO/UE', 'Sojusze międzynarodowe', 2, 'slate', 3,
       ARRAY['nato', 'sojusz', 'unia europejska', 'obronność', 'międzynarodowy']
FROM categories WHERE slug = 'obronnosc'
ON CONFLICT (slug) DO NOTHING;

-- ŚRODOWISKO subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'energia', 'Energia', 'Energia i klimat', 2, 'emerald', 1,
       ARRAY['energia', 'oze', 'odnawialna', 'węgiel', 'atom', 'elektrownia', 'prąd']
FROM categories WHERE slug = 'srodowisko'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'przyroda', 'Przyroda', 'Ochrona przyrody', 2, 'emerald', 2,
       ARRAY['przyroda', 'park narodowy', 'zwierzęta', 'las', 'ochrona gatunkowa']
FROM categories WHERE slug = 'srodowisko'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'odpady', 'Odpady', 'Odpady i recykling', 2, 'emerald', 3,
       ARRAY['odpady', 'śmieci', 'recykling', 'segregacja', 'gospodarka odpadami']
FROM categories WHERE slug = 'srodowisko'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'rolnictwo', 'Rolnictwo', 'Rolnictwo i wieś', 2, 'emerald', 4,
       ARRAY['rolnictwo', 'rolnik', 'wieś', 'dopłaty', 'arn', 'kowr', 'agencja rolna']
FROM categories WHERE slug = 'srodowisko'
ON CONFLICT (slug) DO NOTHING;

-- INFRASTRUKTURA subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'transport', 'Transport', 'Transport i drogi', 2, 'orange', 1,
       ARRAY['transport', 'droga', 'autostrada', 'ekspresowa', 'ruch drogowy', 'kierowca']
FROM categories WHERE slug = 'infrastruktura'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'kolej', 'Kolej', 'Kolej i pociągi', 2, 'orange', 2,
       ARRAY['kolej', 'pociąg', 'pkp', 'pasażer', 'dworzec', 'transport kolejowy']
FROM categories WHERE slug = 'infrastruktura'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'mieszkania', 'Mieszkania', 'Mieszkania i budownictwo', 2, 'orange', 3,
       ARRAY['mieszkanie', 'budownictwo', 'budowlany', 'lokator', 'najem', 'deweloper']
FROM categories WHERE slug = 'infrastruktura'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'telekomunikacja', 'Telekomunikacja', 'Internet i telekom', 2, 'orange', 4,
       ARRAY['telekomunikacja', 'internet', '5g', 'cyfryzacja', 'uke']
FROM categories WHERE slug = 'infrastruktura'
ON CONFLICT (slug) DO NOTHING;

-- KULTURA subcategories
INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'media', 'Media', 'Media i prasa', 2, 'purple', 1,
       ARRAY['media', 'tvp', 'radio', 'prasa', 'dziennikarstwo', 'krrit']
FROM categories WHERE slug = 'kultura'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'dziedzictwo', 'Dziedzictwo', 'Dziedzictwo kulturowe', 2, 'purple', 2,
       ARRAY['dziedzictwo', 'zabytek', 'muzeum', 'pomnik', 'historia', 'kultura']
FROM categories WHERE slug = 'kultura'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (parent_id, slug, name_pl, name_citizen, level, color, display_order, keywords)
SELECT id, 'sport', 'Sport', 'Sport i rekreacja', 2, 'purple', 3,
       ARRAY['sport', 'sportowy', 'igrzyska', 'stadion', 'klub sportowy']
FROM categories WHERE slug = 'kultura'
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
    domain_count INTEGER;
    area_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO domain_count FROM categories WHERE level = 1;
    SELECT COUNT(*) INTO area_count FROM categories WHERE level = 2;
    
    RAISE NOTICE 'Categories created: % domains, % areas', domain_count, area_count;
    
    IF domain_count < 7 THEN
        RAISE EXCEPTION 'Expected at least 7 domains, got %', domain_count;
    END IF;
END $$;
