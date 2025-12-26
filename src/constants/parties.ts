
export interface PartyMetadata {
    id: string; // The key used in DB (e.g. "KO", "PiS")
    name: string; // Full name
    shortName: string; // Abbreviation for display
    color: string;
    logoUrl?: string; // Optional real logo or placeholder
}

export const PARTY_METADATA: Record<string, PartyMetadata> = {
    'KO': {
        id: 'KO',
        name: 'Koalicja Obywatelska',
        shortName: 'KO',
        color: '#ff6b35', // Orange/Red gradient base
    },
    'PiS': {
        id: 'PiS',
        name: 'Prawo i Sprawiedliwość',
        shortName: 'PiS',
        color: '#0066cc', // Blue
    },
    'Polska2050': {
        id: 'Polska2050',
        name: 'Polska 2050 Szymona Hołowni',
        shortName: 'PL2050',
        color: '#f59e0b', // Yellow/Gold
    },
    'PSL-TD': {
        id: 'PSL-TD',
        name: 'Polskie Stronnictwo Ludowe',
        shortName: 'PSL',
        color: '#16a34a', // Green
    },
    'Lewica': {
        id: 'Lewica',
        name: 'Lewica',
        shortName: 'Lewica',
        color: '#dc2626', // Red
    },
    'Konfederacja': {
        id: 'Konfederacja',
        name: 'Konfederacja',
        shortName: 'KONF',
        color: '#111827', // Dark/Black
    },
    'Konfederacja_KP': {
        id: 'Konfederacja_KP',
        name: 'Konfederacja Korony Polskiej',
        shortName: 'KKP',
        color: '#4b5563', // Grayish
    },
    'Razem': {
        id: 'Razem',
        name: 'Partia Razem',
        shortName: 'Razem',
        color: '#991b1b', // Dark Red
    },
    'Republikanie': {
        id: 'Republikanie',
        name: 'Republikanie / Kukiz15',
        shortName: 'Rep',
        color: '#4b5563', // Gray
    },
    'niez.': {
        id: 'niez.',
        name: 'Niezrzeszeni',
        shortName: 'Niez.',
        color: '#64748b', // Slate
    }
};

// Helper to reliably get party data
export const getPartyData = (partyKey: string): PartyMetadata => {
    // Try exact match
    if (PARTY_METADATA[partyKey]) return PARTY_METADATA[partyKey];

    // Try finding case-insensitive or partial? 
    // For now return a default for unknown clubs
    return {
        id: partyKey,
        name: partyKey,
        shortName: partyKey,
        color: '#94a3b8' // Default Slate
    };
};
