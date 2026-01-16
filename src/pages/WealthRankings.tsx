import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Home, DollarSign, ArrowRight } from 'lucide-react';
import Badge from '../components/ui/Badge';
import { useWealthRankings } from '../hooks/useWealthRankings';

export default function WealthRankings() {
    const { data: rankings = [], isLoading: loading } = useWealthRankings();

    const topSavings = useMemo(() => [...rankings].sort((a, b) => b.savings - a.savings).slice(0, 10), [rankings]);
    const topIncome = useMemo(() => [...rankings].sort((a, b) => b.income - a.income).slice(0, 10), [rankings]);
    const topProperties = useMemo(() => [...rankings].sort((a, b) => b.properties_count - a.properties_count).slice(0, 10), [rankings]);


    if (loading) {
        return (
            <div className="min-h-screen bg-page text-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-secondary">Analizowanie oświadczeń majątkowych...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page dashboard-mesh text-primary pt-32 pb-24 px-4 md:px-8">
            <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">

                <div className="text-center space-y-4 mb-16">
                    <h1 className="text-4xl md:text-7xl font-black text-primary tracking-tighter">
                        Rankingi <span className="italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Majątkowe</span>
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto font-medium">
                        Analiza oświadczeń majątkowych posłów wykonana przez sztuczną inteligencję.
                    </p>
                    <p className="text-xs text-secondary/40 font-bold uppercase tracking-widest">
                        *Dane są szacunkowe i pochodzą z automatycznej analizy dokumentów PDF.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-xl shadow-emerald-500/5 transition-all hover:-translate-y-1 hover:border-emerald-500/40">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <DollarSign size={28} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Największe Oszczędności</p>
                                <p className="text-xl font-black text-primary">{topSavings[0]?.name}</p>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {topSavings[0]?.savings.toLocaleString()} <span className="text-sm">PLN</span>
                        </p>
                    </div>

                    <div className="bg-surface p-8 rounded-[2.5rem] border border-accent-blue/20 shadow-xl shadow-accent-blue/5 transition-all hover:-translate-y-1 hover:border-accent-blue/40">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-accent-blue/10 rounded-2xl">
                                <TrendingUp size={28} className="text-accent-blue" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Największy Dochód (Rok)</p>
                                <p className="text-xl font-black text-primary">{topIncome[0]?.name}</p>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-accent-blue font-mono">
                            {topIncome[0]?.income.toLocaleString()} <span className="text-sm">PLN</span>
                        </p>
                    </div>

                    <div className="bg-surface p-8 rounded-[2.5rem] border border-amber-500/20 shadow-xl shadow-amber-500/5 transition-all hover:-translate-y-1 hover:border-amber-500/40">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <Home size={28} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Król Nieruchomości</p>
                                <p className="text-xl font-black text-primary">{topProperties[0]?.name}</p>
                            </div>
                        </div>
                        <p className="text-3xl md:text-4xl font-black text-amber-600 dark:text-amber-400 font-mono">
                            {topProperties[0]?.properties_count} <span className="text-sm font-sans font-medium opacity-60">nieruchomości</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    <div className="bg-surface rounded-[2.5rem] border border-border-base overflow-hidden shadow-xl hover:border-accent-blue/20 transition-colors">
                        <div className="p-8 border-b border-border-base flex items-center gap-4 bg-page/30">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <DollarSign size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-primary tracking-tight">Top 10: Oszczędności</h2>
                        </div>
                        <div className="divide-y divide-border-base/50">
                            {topSavings.map((mp, idx) => (
                                <Link
                                    to={`/poslowie/${mp.mp_id}`}
                                    key={mp.mp_id}
                                    className="flex items-center gap-6 p-6 hover:bg-emerald-500/[0.02] dark:hover:bg-emerald-500/[0.05] transition-colors group"
                                >
                                    <div className="font-black text-secondary/20 w-8 text-center text-2xl group-hover:text-emerald-500 transition-colors italic">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <img
                                        src={mp.photo_url}
                                        alt={mp.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-border-base group-hover:border-emerald-500/50 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xl font-black text-primary group-hover:text-emerald-600 transition-colors truncate">{mp.name}</p>
                                        <div className="mt-1">
                                            <Badge variant="party" party={mp.party} size="xs">
                                                {mp.party}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xl font-mono font-black text-primary">
                                            {Math.round(mp.savings).toLocaleString()} <span className="text-[10px] text-secondary">PLN</span>
                                        </p>
                                    </div>
                                    <ArrowRight size={18} className="text-secondary/20 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="bg-surface rounded-[2.5rem] border border-border-base overflow-hidden shadow-xl hover:border-accent-blue/20 transition-colors">
                        <div className="p-8 border-b border-border-base flex items-center gap-4 bg-page/30">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <Home size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-primary tracking-tight">Top 10: Nieruchomości</h2>
                        </div>
                        <div className="divide-y divide-border-base/50">
                            {topProperties.map((mp, idx) => (
                                <Link
                                    to={`/poslowie/${mp.mp_id}`}
                                    key={mp.mp_id}
                                    className="flex items-center gap-6 p-6 hover:bg-white/[0.02] border-l-4 border-l-transparent hover:border-l-emerald-500 transition-all group"
                                >
                                    <div className="font-black text-secondary/20 w-8 text-center text-2xl group-hover:text-amber-500 transition-colors italic">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <img
                                        src={mp.photo_url}
                                        alt={mp.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-border-base group-hover:border-amber-500/50 transition-colors"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xl font-black text-primary group-hover:text-amber-600 transition-colors truncate">{mp.name}</p>
                                        <div className="mt-1">
                                            <Badge variant="party" party={mp.party} size="xs">
                                                {mp.party}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xl font-mono font-black text-primary">{mp.properties_count}</p>
                                        <p className="text-[10px] text-secondary font-black uppercase tracking-widest">pozycji</p>
                                    </div>
                                    <ArrowRight size={18} className="text-secondary/20 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

