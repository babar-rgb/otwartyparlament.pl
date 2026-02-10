export function cleanSejmTitle(rawTitle: string): string {
    if (!rawTitle) return '';

    let clean = rawTitle;

    // 1. STRIP SUFFIXES (Print Numbers)
    clean = clean.replace(/\s*\((?:druki|druk)\s*nr.*?\)$/gi, '');

    // 2. STRIP BUREAUCRATIC PREFIXES
    const prefixesToRemove = [
        /^\s*(Pkt\.|Punkt)\s*\d+\.?\s*/gi,
        /^\s*Sprawozdanie Komisji o\s*/gi,
        /^\s*Rządowy projekt ustawy\s*/gi,
        /^\s*Poselski projekt ustawy\s*/gi,
        /^\s*Obywatelski projekt ustawy\s*/gi,
        /^\s*Pilny rządowy projekt ustawy\s*/gi,
        /^\s*Uchwała Senatu w sprawie\s*/gi,
        /^\s*Pierwsze czytanie\s*/gi,
        /^\s*Rozstrzygnięcie przez Sejm wniosku.*?:/gi
    ];

    prefixesToRemove.forEach(prefix => {
        clean = clean.replace(prefix, '');
    });

    // 3. SIMPLIFY LEGALESE
    clean = clean.replace(/\s*o zmianie ustawy o\s*/gi, ' Zmiany w ');
    clean = clean.replace(/\s*zmieniającej ustawę o\s*/gi, ' Zmiany w ');
    clean = clean.replace(/\s*oraz niektórych innych ustaw\s*/gi, '');
    clean = clean.replace(/\s*oraz ustawy o działalności leczniczej\s*/gi, '');

    // 4. CAPITALIZATION & CLEANUP
    clean = clean.trim();
    if (clean.length > 0) {
        clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    }

    // Extra cleanup for double spaces
    clean = clean.replace(/\s+/g, ' ');

    return clean;
}

export function extractPrintNumbers(rawTitle: string): string[] {
    const match = rawTitle.match(/\((?:druki|druk)\s*nr\s*(.*?)\)/i);
    if (match && match[1]) {
        // Split by 'i', ',', 'oraz' and trim
        return match[1].split(/,|i|oraz/).map(s => s.trim()).filter(s => s.length > 0);
    }
    return [];
}
