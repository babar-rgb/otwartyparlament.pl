-- Migration: Add missing 2025 Asset Declaration for Michał Połuboczek
-- Date: 2025-12-26
-- Based on median reports (Onet, Fakt) from July 2025 describing the declaration filed in April 2025.

INSERT INTO asset_declarations (mp_id, year, summary, parsed_content, pdf_url)
VALUES (
    490, -- Michał Połuboczek
    '2025',
    'Oświadczenie roczne za 2024 (złożone w 2025). Medialnie komentowane ze względu na wysokie zadłużenie (ok. 1,48 mln zł) i deklarowany brak dochodów.',
    '{
        "savings": 32000,
        "income": 0,
        "real_estate": ["Dom (z kredytem)", "Mieszkanie"],
        "car": ["Mercedes EQS450 (testowy - brak w ośw.)"],
        "debts": "1.48 mln PLN (Kredyt mieszkaniowy, pożyczka na firmę, karty kredytowe)"
    }'::jsonb,
    'https://orka.sejm.gov.pl/osw10.nsf/lista/1/$File/osw10_1_490.pdf' -- Placeholder/Estimated URL based on pattern
);
