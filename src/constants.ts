/* 
 * CRITICAL CONFIGURATION - DO NOT MODIFY WITHOUT EXPLICIT USER INSTRUCTION
 * 
 * VITAL:
 * 1. Konfederacja color MUST be Navy (#142544) - NOT orange, NOT slate.
 * 2. Polska2050 color MUST be Yellow (#eab308).
 * 3. Party matching logic in getPartyColor MUST prioritize Konfederacja over KO.
 * 
 * This file is locked for "vibe coding" regressions.
 */

export const PARTIES = [
    'KO',
    'PiS',
    'Polska2050',
    'PSL-TD',
    'Lewica',
    'Konfederacja',
    'Razem',
    'Kukiz15'
];

// Comprehensive party configuration
// Comprehensive party configuration
export const PARTY_CONFIG: Record<string, {
    color: string;
    bgColor: string;
    name: string;
    shortName: string;
    order: number;
}> = {
    'PiS': { color: '#1d4ed8', bgColor: 'bg-blue-600', name: 'Prawo i Sprawiedliwość', shortName: 'PiS', order: 4 },
    'KO': { color: '#ff6b35', bgColor: 'bg-orange-500', name: 'Koalicja Obywatelska', shortName: 'KO', order: 2 },
    'Polska2050': { color: '#eab308', bgColor: 'bg-yellow-500', name: 'Polska 2050', shortName: 'PL2050', order: 3 },
    'PSL-TD': { color: '#22c55e', bgColor: 'bg-green-500', name: 'Polskie Stronnictwo Ludowe - Trzecia Droga', shortName: 'PSL', order: 3 },
    'Lewica': { color: '#dc2626', bgColor: 'bg-red-600', name: 'Lewica', shortName: 'Lewica', order: 1 },
    'Konfederacja': { color: '#142544', bgColor: 'bg-slate-900', name: 'Konfederacja', shortName: 'Konf.', order: 5 },
    'Razem': { color: '#7c3aed', bgColor: 'bg-violet-600', name: 'Razem', shortName: 'Razem', order: 1 },
    'Kukiz15': { color: '#4b5563', bgColor: 'bg-gray-600', name: "Kukiz'15", shortName: 'K15', order: 4 },
    'Niezrzeszeni': { color: '#9ca3af', bgColor: 'bg-gray-400', name: 'Niezrzeszeni', shortName: 'Niezrz.', order: 6 },
};

// Helper to get party color (handles various party name formats)
export function getPartyColor(party: string): string {
    if (!party) return '#9ca3af';
    const p = party.toLowerCase();

    // Specific checks FIRST to avoid partial matches on shorter aliases
    if (p.includes('konfederacja')) return PARTY_CONFIG['Konfederacja'].color;
    if (p.includes('pis') || p.includes('prawo i sprawiedliwość')) return PARTY_CONFIG['PiS'].color;
    if (p.includes('ko') || p.includes('koalicja obywatelska') || p.includes('platforma')) return PARTY_CONFIG['KO'].color;
    if (p.includes('polska') || p.includes('trzecia droga')) return PARTY_CONFIG['Polska2050'].color;
    if (p.includes('psl')) return PARTY_CONFIG['PSL-TD'].color;
    if (p.includes('lewica')) return PARTY_CONFIG['Lewica'].color;
    if (p.includes('razem')) return PARTY_CONFIG['Razem'].color;
    if (p.includes('kukiz')) return PARTY_CONFIG['Kukiz15'].color;

    return PARTY_CONFIG['Niezrzeszeni'].color;
}

export const PRINT_CATEGORIES = {
    'projekt ustawy': { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'PROJEKT USTAWY' },
    'sprawozdanie': { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'SPRAWOZDANIE' },
    'informacja / raport': { color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', label: 'RAPORT / INFO' },
    'projekt uchwały': { color: 'bg-pink-500/10 text-pink-400 border-pink-500/20', label: 'PROJEKT UCHWAŁY' },
    'ustawa budżetowa': { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'USTAWA BUDŻETOWA' },
    'dokument / inny': { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'DOKUMENT / INNY' },
    // Source mappings (lowercase for matching)
    'rządowy': { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'RZĄDOWY' },
    'poselski': { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'POSELSKI' },
    'obywatelski': { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'OBYWATELSKI' },
    'senacki': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', label: 'SENACKI' },
    'komisyjny': { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'KOMISYJNY' },
    'prezydencki': { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'PREZYDENCKI' },
};

export const DEFAULT_PRINT_STYLE = { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'DOKUMENT' };

export const PRINT_SOURCE_FILTERS = [
    { label: 'Wszystkie', value: null },
    { label: 'Rządowe', value: 'Rządowy' },
    { label: 'Poselskie', value: 'Poselski' },
    { label: 'Obywatelskie', value: 'Obywatelski' },
    { label: 'Senackie', value: 'Senacki' },
];

