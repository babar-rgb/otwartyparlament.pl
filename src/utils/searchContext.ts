/**
 * Intelligent Search Context Map
 * ===============================
 * Maps common Polish terms to related political/legal concepts.
 * Enables semantic search: "drożyzna" → finds inflation, prices, taxes, etc.
 */

import { EXPANDED_CONTEXT_MAP } from './expandedContext';

// Synonym groups: user term → expanded search terms
export const CONTEXT_MAP: Record<string, string[]> = {
    // ECONOMY & PRICES
    'drożyzna': ['inflacja', 'ceny', 'podatek', 'vat', 'akcyza', 'koszt życia', 'podwyżka', 'gospodarka', 'budżet'],
    'inflacja': ['drożyzna', 'ceny', 'nbp', 'stopy procentowe', 'gospodarka', 'budżet', 'podatek'],
    'ceny': ['drożyzna', 'inflacja', 'podwyżka', 'taryfa', 'opłata', 'koszt'],
    'kredyt': ['hipoteka', 'bank', 'rata', 'oprocentowanie', 'frankowicz', 'pożyczka', 'nbp'],
    'mieszkanie': ['kredyt', 'hipoteka', 'deweloper', 'najem', 'lokator', 'budownictwo', 'bezpieczny kredyt'],
    'praca': ['zatrudnienie', 'bezrobocie', 'płaca', 'minimalna', 'umowa', 'kodeks pracy', 'zus'],
    'bezrobocie': ['praca', 'zatrudnienie', 'zasiłek', 'urząd pracy', 'aktywizacja'],
    'podatki': ['pit', 'cit', 'vat', 'akcyza', 'fiskus', 'skarbowy', 'danina', 'ulga'],
    'firma': ['przedsiębiorca', 'działalność', 'spółka', 'biznes', 'podatek', 'zus'],

    // HEALTH
    'lekarz': ['zdrowie', 'szpital', 'nfz', 'pacjent', 'medycyna', 'leczenie', 'recepta'],
    'szpital': ['zdrowie', 'lekarz', 'nfz', 'pacjent', 'leczenie', 'ratownictwo'],
    'choroba': ['zdrowie', 'leczenie', 'szpital', 'lekarz', 'refundacja', 'lek'],
    'lek': ['apteka', 'refundacja', 'recepta', 'farmacja', 'zdrowie'],
    'covid': ['pandemia', 'epidemia', 'szczepionka', 'lockdown', 'obostrzenia', 'zdrowie'],

    // EDUCATION
    'szkoła': ['edukacja', 'nauczyciel', 'uczeń', 'oświata', 'reforma', 'program nauczania'],
    'nauczyciel': ['szkoła', 'edukacja', 'karta nauczyciela', 'wynagrodzenie', 'oświata'],
    'student': ['uczelnia', 'uniwersytet', 'studia', 'stypendium', 'szkolnictwo wyższe'],
    'matura': ['egzamin', 'szkoła', 'edukacja', 'reforma'],

    // FAMILY & SOCIAL
    'dziecko': ['rodzina', '500+', '800+', 'żłobek', 'przedszkole', 'alimenty', 'urlop macierzyński'],
    'rodzina': ['dziecko', '500+', '800+', 'urlop', 'świadczenie', 'zasiłek'],
    '500+': ['800+', 'dziecko', 'rodzina', 'świadczenie wychowawcze', 'rodzic'],
    '800+': ['500+', 'dziecko', 'rodzina', 'świadczenie wychowawcze', 'rodzic'],
    'emerytura': ['renta', 'zus', 'waloryzacja', 'trzynastka', 'czternastka', 'wiek emerytalny'],
    'senior': ['emerytura', 'renta', 'opieka', 'zdrowie', 'senior+'],

    // SECURITY & DEFENSE
    'wojna': ['ukraina', 'obronność', 'wojsko', 'nato', 'bezpieczeństwo', 'granica'],
    'ukraina': ['wojna', 'uchodźcy', 'pomoc', 'granica', 'azyl', 'obronność'],
    'wojsko': ['armia', 'żołnierz', 'obronność', 'nato', 'służba wojskowa'],
    'policja': ['bezpieczeństwo', 'przestępczość', 'służby', 'porządek'],
    'granica': ['migracja', 'uchodźcy', 'straż graniczna', 'schengen', 'azyl'],

    // JUSTICE
    'sąd': ['sprawiedliwość', 'sędzia', 'trybunał', 'krs', 'wyrok', 'prawo'],
    'kara': ['więzienie', 'przestępstwo', 'kodeks karny', 'wyrok', 'grzywna'],
    'rozwód': ['rodzina', 'alimenty', 'prawo rodzinne', 'kodeks cywilny'],

    // ENVIRONMENT & ENERGY
    'klimat': ['środowisko', 'emisja', 'co2', 'zielona energia', 'oze', 'transformacja'],
    'energia': ['prąd', 'gaz', 'węgiel', 'oze', 'cena', 'taryfa', 'elektrownia'],
    'prąd': ['energia', 'cena', 'taryfa', 'elektrownia', 'oze'],
    'smog': ['powietrze', 'środowisko', 'emisja', 'węgiel', 'opłata'],
    'śmieci': ['odpady', 'recykling', 'opłata', 'segregacja', 'środowisko'],

    // AGRICULTURE
    'rolnik': ['rolnictwo', 'wieś', 'dopłaty', 'koła gospodyń', 'arimr', 'uprawy'],
    'wieś': ['rolnik', 'rolnictwo', 'gmina', 'infrastruktura', 'dopłaty'],

    // TRANSPORT
    'samochód': ['drogi', 'paliwo', 'akcyza', 'rejestracja', 'ubezpieczenie', 'transport'],
    'paliwo': ['benzyna', 'diesel', 'akcyza', 'cena', 'stacja benzynowa'],
    'drogi': ['autostrada', 'transport', 'viaTOLL', 'infrastruktura', 'remont'],
    'kolej': ['pociąg', 'pkp', 'bilet', 'opóźnienie', 'transport'],

    // POLITICS
    'wybory': ['głosowanie', 'kampania', 'mandat', 'pkw', 'ordynacja'],
    'prezydent': ['wybory', 'weto', 'ustawa', 'nominacja'],
    'rząd': ['minister', 'premier', 'gabinet', 'polityka', 'ustawa'],
    'korupcja': ['przestępstwo', 'afera', 'łapówka', 'prokuratura', 'śledztwo'],

    // COMMON QUERIES
    'aborcja': ['ciąża', 'kobieta', 'zdrowie reprodukcyjne', 'prawo', 'życie'],
    'lgbt': ['związki partnerskie', 'równość', 'dyskryminacja', 'małżeństwo'],
    'kościół': ['religia', 'fundusz kościelny', 'katecheza', 'konkordatu'],
    'media': ['tvp', 'radio', 'prasa', 'dziennikarstwo', 'abonament'],
};

// Category suggestions based on context
export const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
    'drożyzna': ['podatki', 'budzet', 'bankowosc'],
    'kredyt': ['bankowosc', 'mieszkania'],
    'szkoła': ['edukacja'],
    'lekarz': ['zdrowie'],
    'dziecko': ['rodzina', 'edukacja'],
    'emerytura': ['emerytury'],
    'wojna': ['obronnosc', 'granice'],
    'klimat': ['energia', 'srodowisko'],
    'wybory': ['wybory'],
};

/**
 * Expand a search query with related terms
 * Uses both base CONTEXT_MAP and EXPANDED_CONTEXT_MAP for 200+ mappings
 */
export function expandSearchQuery(query: string): string[] {
    const words = query.toLowerCase().trim().split(/\s+/);
    const expanded = new Set<string>(words);

    // Import expanded map dynamically
    const COMBINED_MAP = { ...CONTEXT_MAP, ...EXPANDED_CONTEXT_MAP };

    for (const word of words) {
        // Check direct mapping
        if (COMBINED_MAP[word]) {
            COMBINED_MAP[word].forEach(term => expanded.add(term));
        }

        // Check if word is in any mapping's values
        for (const [key, values] of Object.entries(COMBINED_MAP)) {
            if (values.includes(word)) {
                expanded.add(key);
                // Add some related terms (limit to avoid explosion)
                values.slice(0, 3).forEach(v => expanded.add(v));
            }
        }
    }

    return Array.from(expanded);
}

/**
 * Get category suggestions for a query
 */
export function getCategorySuggestions(query: string): string[] {
    const words = query.toLowerCase().trim().split(/\s+/);
    const categories = new Set<string>();

    for (const word of words) {
        if (CATEGORY_SUGGESTIONS[word]) {
            CATEGORY_SUGGESTIONS[word].forEach(cat => categories.add(cat));
        }
    }

    return Array.from(categories);
}

/**
 * Build a search-friendly query string for database
 */
export function buildSearchPattern(query: string): string {
    const expanded = expandSearchQuery(query);
    // Return terms joined for ILIKE pattern matching
    return expanded.join('|');
}
