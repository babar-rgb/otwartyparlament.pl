export const getPartyStyle = (party: string): string => {
    const p = party?.toLowerCase() || '';

    // Konfederacja - MUST be before KO check (contains 'ko' substring!)
    if (p.includes('konfederacja') || p.includes('nowa nadzieja') || p.includes('ruch narodowy'))
        return 'bg-gradient-to-r from-[#0a1628] to-[#000000] text-white border-transparent shadow-md';

    // KO / Koalicja Obywatelska
    if (p.includes('koalicja obywatelska') || p === 'ko' || p.includes('platforma') || p.includes('nowoczesna') || p.includes('inicjatywa polska'))
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md';

    // PiS / Prawo i Sprawiedliwość
    if (p.includes('pis') || p.includes('prawo i sprawiedliwość') || p.includes('suwerenna polska'))
        return 'bg-gradient-to-r from-blue-700 to-blue-900 text-white border-transparent shadow-md';

    // Polska 2050 - official golden yellow
    if (p.includes('polska 2050') || p.includes('trzecia droga (polska 2050)') || p === 'polska2050')
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-transparent shadow-md';

    // PSL
    if (p.includes('psl') || p.includes('trzecia droga (psl)') || p.includes('ludowe') || p === 'psl-td')
        return 'bg-gradient-to-r from-green-600 to-emerald-700 text-white border-transparent shadow-md';

    // Lewica / Razem
    if (p.includes('lewica') || p.includes('razem') || p.includes('nowa lewica'))
        return 'bg-gradient-to-r from-purple-600 to-red-600 text-white border-transparent shadow-md';

    // Kukiz
    if (p.includes('kukiz'))
        return 'bg-slate-700 text-white border-transparent shadow-md';

    // Default / Other
    return 'bg-surface text-secondary border-border-base';
};

export const getEuGroupStyle = (group: string): string => {
    const g = group?.toUpperCase() || '';
    if (g.includes('PPE')) return 'bg-blue-600 text-white border-transparent shadow-md';
    if (g.includes('S&D')) return 'bg-red-600 text-white border-transparent shadow-md';
    if (g.includes('RENEW')) return 'bg-amber-400 text-slate-900 border-transparent shadow-md';
    if (g.includes('ECR')) return 'bg-indigo-900 text-white border-transparent shadow-md';
    if (g.includes('VERTS/ALE')) return 'bg-green-600 text-white border-transparent shadow-md';
    if (g.includes('THE LEFT')) return 'bg-red-800 text-white border-transparent shadow-md';
    if (g.includes('ID')) return 'bg-slate-800 text-white border-transparent shadow-md';
    if (g.includes('NI')) return 'bg-slate-500 text-white border-transparent shadow-md';
    return 'bg-surface text-secondary border-border-base';
};

// Simple HEX colors for Charts/Graphs where CSS classes don't work
export const getPartyHexColor = (party: string): string => {
    const p = party?.toLowerCase() || '';

    // Konfederacja - check FIRST (contains 'ko' substring!)
    if (p.includes('konfederacja') || p.includes('konf')) return '#0a1628';

    // KO
    if (p.includes('koalicja') || p === 'ko') return '#E30613';

    // PiS
    if (p.includes('pis') || p.includes('prawo')) return '#000080';

    // Others
    if (p.includes('polska 2050')) return '#FCD34D';
    if (p.includes('psl')) return '#16A34A';
    if (p.includes('lewica')) return '#C026D3';

    return '#64748B';
};
