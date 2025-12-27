import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Link } from 'react-router-dom';
import { TrendingUp, Home, DollarSign, ArrowRight } from 'lucide-react';

interface WealthData {
    mp_id: number;
    name: string;
    party: string;
    photo_url: string;
    savings: number;
    income: number;
    properties_count: number;
    summary: string;
    year?: string; // Year of the declaration
}

export default function WealthRankings() {
    const [rankings, setRankings] = useState<WealthData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: mps, error } = await db
                    .from('mps')
                    .select(`
                        id,
                        first_name,
                        last_name,
                        club,
                        photo_url,
                        asset_declarations (
                            parsed_content,
                            summary,
                            year
                        )
                    `);

                if (error) throw error;

                const processed: WealthData[] = mps
                    .map((mp: any) => {
                        // CRITICAL: Sort declarations by year DESCENDING to get newest first
                        const sortedDeclarations = (mp.asset_declarations || [])
                            .filter((d: any) => d && d.parsed_content)
                            .sort((a: any, b: any) => {
                                const yearA = a.year || '0000';
                                const yearB = b.year || '0000';
                                return yearB.localeCompare(yearA); // Descending - newest first
                            });

                        const decl = sortedDeclarations[0];
                        if (!decl) return null;

                        const parseAmount = (val: any): number => {
                            if (typeof val === 'number') return val;
                            if (typeof val === 'string') {
                                const clean = val.replace(/[^\d.,-]/g, '').replace(',', '.');
                                return parseFloat(clean) || 0;
                            }
                            return 0;
                        };

                        return {
                            mp_id: mp.id,
                            name: `${mp.first_name} ${mp.last_name}`,
                            party: mp.club,
                            photo_url: mp.photo_url,
                            savings: parseAmount(decl.parsed_content.savings),
                            income: parseAmount(decl.parsed_content.income),
                            properties_count: decl.parsed_content.real_estate?.length || 0,
                            summary: decl.summary,
                            year: decl.year // Add year to track which declaration is used
                        };
                    })
                    .filter(Boolean) as WealthData[];

                setRankings(processed);
            } catch (err) {
                console.error('Error fetching wealth data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const topSavings = [...rankings].sort((a, b) => b.savings - a.savings).slice(0, 10);
    const topIncome = [...rankings].sort((a, b) => b.income - a.income).slice(0, 10);
    const topProperties = [...rankings].sort((a, b) => b.properties_count - a.properties_count).slice(0, 10);

    const getPartyColor = (party: string) => {
        const p = party?.toLowerCase() || '';
        // Check Konfederacja first (contains 'ko')
        if (p.includes('konfederacja')) return 'bg-gradient-to-r from-[#0a1628] to-[#000000]';
        if (p.includes('ko') || p.includes('koalicja')) return 'bg-gradient-to-r from-orange-500 to-red-600';
        if (p.includes('pis')) return 'bg-blue-700';
        if (p.includes('2050')) return 'bg-yellow-500 text-black';
        if (p.includes('psl')) return 'bg-green-600';
        if (p.includes('lewica')) return 'bg-gradient-to-r from-purple-600 to-red-500';
        return 'bg-slate-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#060613] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Analizowanie oświadczeń majątkowych...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060613] text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                        Rankingi Majątkowe
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Analiza oświadczeń majątkowych posłów wykonana przez sztuczną inteligencję.
                    </p>
                    <p className="text-sm text-white/40">
                        *Dane są szacunkowe i pochodzą z automatycznej analizy dokumentów PDF. Mogą zawierać błędy.
                    </p>
                </div>

                {/* Top 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Savings Leader */}
                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 p-6 rounded-[2rem] border border-emerald-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <DollarSign size={28} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Największe Oszczędności</p>
                                <p className="text-xl font-black text-white">{topSavings[0]?.name}</p>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-emerald-400">
                            {topSavings[0]?.savings.toLocaleString()} PLN
                        </p>
                    </div>

                    {/* Income Leader */}
                    <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/10 p-6 rounded-[2rem] border border-blue-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <TrendingUp size={28} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Największy Dochód (Rok)</p>
                                <p className="text-xl font-black text-white">{topIncome[0]?.name}</p>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-blue-400">
                            {topIncome[0]?.income.toLocaleString()} PLN
                        </p>
                    </div>

                    {/* Properties Leader */}
                    <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-6 rounded-[2rem] border border-amber-500/20 backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <Home size={28} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Król Nieruchomości</p>
                                <p className="text-xl font-black text-white">{topProperties[0]?.name}</p>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-amber-400">
                            {topProperties[0]?.properties_count} <span className="text-lg text-amber-500/70 font-medium">nieruchomości</span>
                        </p>
                    </div>
                </div>

                {/* Rankings Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Savings Ranking */}
                    <div className="bg-[#111126] rounded-[2rem] border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center gap-3">
                            <DollarSign className="text-emerald-400" size={24} />
                            <h2 className="text-xl font-black text-white">Top 10: Oszczędności</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {topSavings.map((mp, idx) => (
                                <Link
                                    to={`/poslowie/${mp.mp_id}`}
                                    key={mp.mp_id}
                                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="font-black text-white/30 w-6 text-center text-lg group-hover:text-emerald-400 transition-colors">
                                        {idx + 1}
                                    </div>
                                    <img
                                        src={mp.photo_url}
                                        alt={mp.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-emerald-500/50 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{mp.name}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getPartyColor(mp.party)}`}>
                                            {mp.party}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-white">{mp.savings.toLocaleString()} PLN</p>
                                    </div>
                                    <ArrowRight size={16} className="text-white/20 group-hover:text-emerald-400 transition-colors shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Real Estate Ranking */}
                    <div className="bg-[#111126] rounded-[2rem] border border-white/5 overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center gap-3">
                            <Home className="text-amber-400" size={24} />
                            <h2 className="text-xl font-black text-white">Top 10: Nieruchomości</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {topProperties.map((mp, idx) => (
                                <Link
                                    to={`/poslowie/${mp.mp_id}`}
                                    key={mp.mp_id}
                                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="font-black text-white/30 w-6 text-center text-lg group-hover:text-amber-400 transition-colors">
                                        {idx + 1}
                                    </div>
                                    <img
                                        src={mp.photo_url}
                                        alt={mp.name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 group-hover:border-amber-500/50 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white group-hover:text-amber-400 transition-colors truncate">{mp.name}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${getPartyColor(mp.party)}`}>
                                            {mp.party}
                                        </span>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-white">{mp.properties_count}</p>
                                        <p className="text-xs text-white/40">pozycji</p>
                                    </div>
                                    <ArrowRight size={16} className="text-white/20 group-hover:text-amber-400 transition-colors shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
