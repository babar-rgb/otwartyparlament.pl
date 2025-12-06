export const getPartyStyle = (party: string): string => {
    const p = party?.toLowerCase() || '';

    // KO / Koalicja Obywatelska
    if (p.includes('ko') || p.includes('koalicja obywatelska') || p.includes('po') || p.includes('nowoczesna') || p.includes('inicjatywa polska'))
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md';

    // PiS / Prawo i Sprawiedliwość
    if (p.includes('pis') || p.includes('prawo i sprawiedliwość') || p.includes('suwerenna polska'))
        return 'bg-gradient-to-r from-blue-700 to-blue-900 text-white border-transparent shadow-md';

    // Polska 2050
    if (p.includes('polska 2050') || p.includes('trzecia droga (polska 2050)'))
        return 'bg-yellow-400 text-black border-transparent shadow-md';

    // PSL
    if (p.includes('psl') || p.includes('trzecia droga (psl)') || p.includes('ludowe'))
        return 'bg-gradient-to-r from-green-600 to-emerald-700 text-white border-transparent shadow-md';

    // Konfederacja
    if (p.includes('konfederacja') || p.includes('nowa nadzieja') || p.includes('ruch narodowy'))
        return 'bg-gradient-to-r from-[#091F42] to-[#0f284d] text-white border-transparent shadow-md';

    // Lewica / Razem
    if (p.includes('lewica') || p.includes('razem') || p.includes('nowa lewica'))
        return 'bg-gradient-to-r from-purple-600 to-red-600 text-white border-transparent shadow-md';

    // Kukiz
    if (p.includes('kukiz'))
        return 'bg-slate-700 text-white border-transparent shadow-md';

    // Default / Other
    return 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:border-blue-500';
};

// Simple HEX colors for Charts/Graphs where CSS classes don't work
export const getPartyHexColor = (party: string): string => {
    const p = party?.toLowerCase() || '';

    if (p.includes('ko') || p.includes('koalicja')) return '#0096FF'; // Blue/Orange hybrid used in charts usually
    if (p.includes('pis') || p.includes('prawo')) return '#800000'; // Dark Blue/Red? No, PiS is Blue usually. Let's standarize to commonly used. 
    // Actually, let's match the MpProfile implementation

    if (p.includes('pis')) return '#000080';
    if (p.includes('ko')) return '#E30613'; // KO often red/orange heart
    if (p.includes('polska 2050')) return '#FCD34D';
    if (p.includes('psl')) return '#16A34A';
    if (p.includes('konf')) return '#0F172A';
    if (p.includes('lewica')) return '#C026D3';

    return '#64748B';
};
