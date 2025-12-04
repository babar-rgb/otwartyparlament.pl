import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
}

export default function WealthRankings() {
    const [rankings, setRankings] = useState<WealthData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch MPs and their declarations
                // Note: This is a bit heavy, in a real app we'd use a database view or RPC
                const { data: mps, error } = await supabase
                    .from('mps')
                    .select(`
            id,
            name,
            party,
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
                        // Get the latest declaration (usually 2023 or 2024)
                        // For simplicity, we take the first one that has content
                        const decl = mp.asset_declarations?.[0];
                        if (!decl || !decl.parsed_content) return null;

                        return {
                            mp_id: mp.id,
                            name: mp.name,
                            party: mp.party,
                            photo_url: mp.photo_url,
                            savings: decl.parsed_content.savings || 0,
                            income: decl.parsed_content.income || 0,
                            properties_count: decl.parsed_content.real_estate?.length || 0,
                            summary: decl.summary
                        };
                    })
                    .filter((item): item is WealthData => item !== null);

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
        const colors: Record<string, string> = {
            'PiS': '#800000',
            'KO': '#0096FF',
            'Polska2050': '#00A150',
            'PSL-TD': '#90EE90',
            'Lewica': '#FF0000',
            'Konfederacja': '#000080',
            'INNE': '#1F2937',
        };
        return colors[party] || '#64748B';
    };

    if (loading) return <div className="text-center py-12">Analizowanie oświadczeń majątkowych...</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-12 pt-24 pb-12 px-4 animate-fade-in">

            {/* Header */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900">
                    Rankingi Majątkowe
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Analiza oświadczeń majątkowych posłów wykonana przez sztuczną inteligencję.
                    <br />
                    <span className="text-sm text-slate-400 mt-2 block">
                        *Dane są szacunkowe i pochodzą z automatycznej analizy dokumentów PDF. Mogą zawierać błędy.
                    </span>
                </p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <DollarSign size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Największe Oszczędności</p>
                            <p className="text-2xl font-black text-slate-900">{topSavings[0]?.name}</p>
                        </div>
                    </div>
                    <p className="text-4xl font-black text-emerald-600">
                        {topSavings[0]?.savings.toLocaleString()} PLN
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <TrendingUp size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Największy Dochód (Rok)</p>
                            <p className="text-2xl font-black text-slate-900">{topIncome[0]?.name}</p>
                        </div>
                    </div>
                    <p className="text-4xl font-black text-blue-600">
                        {topIncome[0]?.income.toLocaleString()} PLN
                    </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                            <Home size={32} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800 uppercase tracking-wide">Król Nieruchomości</p>
                            <p className="text-2xl font-black text-slate-900">{topProperties[0]?.name}</p>
                        </div>
                    </div>
                    <p className="text-4xl font-black text-amber-600">
                        {topProperties[0]?.properties_count} <span className="text-lg text-amber-800 font-medium">nieruchomości</span>
                    </p>
                </div>
            </div>

            {/* Rankings Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Savings Ranking */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <DollarSign className="text-emerald-500" />
                            Top 10: Oszczędności
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {topSavings.map((mp, idx) => (
                            <Link to={`/poslowie/${mp.mp_id}`} key={mp.mp_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                                <div className="font-black text-slate-300 w-6 text-center text-lg group-hover:text-emerald-500 transition-colors">
                                    {idx + 1}
                                </div>
                                <img src={mp.photo_url} alt={mp.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{mp.name}</p>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: getPartyColor(mp.party) }}>
                                        {mp.party}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900">{mp.savings.toLocaleString()} PLN</p>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Real Estate Ranking */}
                <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Home className="text-amber-500" />
                            Top 10: Nieruchomości
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {topProperties.map((mp, idx) => (
                            <Link to={`/poslowie/${mp.mp_id}`} key={mp.mp_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                                <div className="font-black text-slate-300 w-6 text-center text-lg group-hover:text-amber-500 transition-colors">
                                    {idx + 1}
                                </div>
                                <img src={mp.photo_url} alt={mp.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                                <div className="flex-1">
                                    <p className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{mp.name}</p>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: getPartyColor(mp.party) }}>
                                        {mp.party}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900">{mp.properties_count}</p>
                                    <p className="text-xs text-slate-500">pozycji</p>
                                </div>
                                <ArrowRight size={16} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
