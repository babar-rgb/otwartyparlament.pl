import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Home, Car, Coins, Building2, ArrowUpDown } from 'lucide-react';

interface MPWealth {
    mp_id: number;
    first_name: string;
    last_name: string;
    club: string;
    photo_url: string;
    income: number;
    savings: number;
    real_estate_count: number;
    vehicles_count: number;
    net_worth: number;
    year: string;
}

export default function WealthRankings() {
    const [rankings, setRankings] = useState<MPWealth[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'income' | 'net_worth' | 'savings'>('net_worth');

    useEffect(() => {
        fetch('/api/wealth-rankings')
            .then(res => res.json())
            .then(data => {
                setRankings(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load wealth rankings:', err);
                setLoading(false);
            });
    }, []);

    const sortedRankings = [...rankings].sort((a, b) => b[sortBy] - a[sortBy]);

    const getPartyBadge = (party: string) => {
        const p = party?.toUpperCase() || '';
        if (p.includes('KONFEDERACJA')) return 'bg-slate-900 text-white border border-slate-700';
        if (p.includes('KO')) return 'bg-orange-500/10 text-orange-600 border border-orange-500/20';
        if (p.includes('PIS')) return 'bg-blue-600/10 text-blue-700 border border-blue-600/20';
        if (p.includes('PL2050')) return 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20';
        if (p.includes('LEWICA')) return 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
        if (p.includes('PSL')) return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
        return 'bg-surface text-secondary border border-border-base';
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
        return amount.toString();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-page gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-border-base rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-secondary">Ładowanie Danych Majątkowych</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page dashboard-mesh text-primary pt-32 pb-24 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-16">
                    <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 flex flex-col md:flex-row md:items-baseline gap-4">
                        Rankingi <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 italic font-serif">Majątkowe</span>
                    </h1>
                    <p className="text-secondary max-w-2xl text-lg font-medium leading-relaxed border-l-2 border-emerald-500/30 pl-8">
                        Analiza oświadczeń majątkowych posłów wykonana przez sztuczną inteligencję. Dane z automatycznej analizy dokumentów PDF.
                    </p>
                </div>

                {/* Sort Controls */}
                <div className="mb-8 flex gap-4 flex-wrap">
                    <button
                        onClick={() => setSortBy('net_worth')}
                        className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${sortBy === 'net_worth'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-surface border border-border-base text-secondary hover:bg-emerald-500/10'
                            }`}
                    >
                        <ArrowUpDown size={16} className="inline mr-2" />
                        Majątek Netto
                    </button>
                    <button
                        onClick={() => setSortBy('income')}
                        className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${sortBy === 'income'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-surface border border-border-base text-secondary hover:bg-emerald-500/10'
                            }`}
                    >
                        <TrendingUp size={16} className="inline mr-2" />
                        Dochody
                    </button>
                    <button
                        onClick={() => setSortBy('savings')}
                        className={`px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all ${sortBy === 'savings'
                            ? 'bg-emerald-500 text-white shadow-lg'
                            : 'bg-surface border border-border-base text-secondary hover:bg-emerald-500/10'
                            }`}
                    >
                        <Coins size={16} className="inline mr-2" />
                        Oszczędności
                    </button>
                </div>

                {/* Rankings List */}
                <div className="bg-surface rounded-[3rem] border border-border-base shadow-2xl overflow-hidden">
                    <div className="p-8 md:p-12 space-y-3">
                        {sortedRankings.map((mp, idx) => (
                            <Link
                                key={mp.mp_id}
                                to={`/poslowie/${mp.mp_id}`}
                                className="grid grid-cols-12 items-center px-8 py-6 bg-page border border-border-base rounded-2xl hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:shadow-xl transition-all group"
                            >
                                {/* Rank */}
                                <div className="col-span-1">
                                    <span className={`text-2xl font-black italic ${idx < 3 ? 'text-emerald-500' : 'text-secondary/20'}`}>
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </span>
                                </div>

                                {/* MP Info */}
                                <div className="col-span-6 flex items-center gap-6">
                                    <img
                                        src={mp.photo_url || `https://ui-avatars.com/api/?name=${mp.last_name}&background=111126&color=666`}
                                        alt=""
                                        className="w-14 h-14 rounded-full object-cover border border-border-base"
                                    />
                                    <div>
                                        <div className="text-xl font-black text-primary group-hover:text-emerald-500 transition-colors flex items-center gap-4">
                                            <span>{mp.first_name} {mp.last_name}</span>
                                            <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${getPartyBadge(mp.club)}`}>
                                                {mp.club}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-secondary uppercase tracking-widest mt-1 font-bold">
                                            Oświadczenie {mp.year}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="col-span-5 grid grid-cols-4 gap-4">
                                    <div className="flex flex-col items-center">
                                        <TrendingUp size={16} className="text-emerald-500 mb-1" />
                                        <span className="text-sm font-mono font-black text-primary">{formatCurrency(mp.income)}</span>
                                        <span className="text-[8px] text-secondary uppercase tracking-wider">Dochód</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Coins size={16} className="text-amber-500 mb-1" />
                                        <span className="text-sm font-mono font-black text-primary">{formatCurrency(mp.savings)}</span>
                                        <span className="text-[8px] text-secondary uppercase tracking-wider">Oszczęd.</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Home size={16} className="text-blue-500 mb-1" />
                                        <span className="text-sm font-mono font-black text-primary">{mp.real_estate_count}</span>
                                        <span className="text-[8px] text-secondary uppercase tracking-wider">Nierucho.</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Car size={16} className="text-rose-500 mb-1" />
                                        <span className="text-sm font-mono font-black text-primary">{mp.vehicles_count}</span>
                                        <span className="text-[8px] text-secondary uppercase tracking-wider">Pojazdy</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-12 p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <div className="flex gap-4">
                        <Building2 className="text-amber-500 shrink-0" size={24} />
                        <div>
                            <h3 className="font-black text-primary mb-2">Nota Metodologiczna</h3>
                            <p className="text-sm text-secondary leading-relaxed">
                                Dane wyekstrahowane automatycznie z oświadczeń majątkowych przy użyciu Gemini AI.
                                Mogą zawierać błędy wynikające z jakości skanów PDF lub niejednoznaczności w dokumentach.
                                Zawsze weryfikuj z oryginalnymi oświadczeniami na stronie Sejmu.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
