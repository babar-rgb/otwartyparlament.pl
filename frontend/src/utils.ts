export const formatSejmTitle = (rawTitle: string): string => {
    if (!rawTitle) return "";

    let cleanTitle = rawTitle;

    // 1. Remove Prefix: "Pkt. 2 ", "Punkt 15" (case-insensitive)
    cleanTitle = cleanTitle.replace(/^(Pkt\.|Punkt)\s*\d+\.?\s*/gi, "");

    // 2. Remove Suffix: "(druk nr 1)", "(druki nr 53, 54)" (at end of string)
    cleanTitle = cleanTitle.replace(/\s*\(druki?\s*nr.*?\)$/gi, "");

    // 3. Remove Procedural Noise
    if (cleanTitle.match(/^1\.\s*posiedzenie/i)) {
        return "Sprawy Regulaminowe / Posiedzenie Sejmu";
    }

    // 4. Trim
    return cleanTitle.trim();
};

export const formatMPName = (firstName: string, lastName: string | null | undefined): string => {
    return [firstName, lastName]
        .filter(part => Boolean(part) && part !== 'null')
        .join(' ')
        .trim();
};

export const extractPrintNumber = (title: string): string | null => {
    if (!title) return null;
    // Matches "druk nr 24", "druki nr 24, 25", "Druku nr 30"
    // We strictly want the FIRST number found after "druk nr"
    const match = title.match(/duku\s*nr\s*(\d+)/i) || title.match(/druki?\s*nr\s*(\d+)/i);
    return match ? match[1] : null;
};
