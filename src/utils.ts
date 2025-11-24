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
