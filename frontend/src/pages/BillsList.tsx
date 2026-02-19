import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Calendar, ChevronRight, ChevronLeft, ArrowRight, Network, Search, Filter } from 'lucide-react';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/ui/TermSwitcher';
import SEO from '../components/SEO';
import { useBillsList } from '../hooks/useBillsList';

interface Process {
    number: number;
    title: string;
    description: string;
    processStartDate: string;
    documentId: string;
    type?: string;
}

// 🔵 Color Mapping
const getProcessColor = (type?: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('poselski')) return 'text-blue-600 dark:text-blue-400 border-blue-600/30';
    if (t.includes('rządowy')) return 'text-emerald-600 dark:text-emerald-400 border-emerald-600/30';
    if (t.includes('obywatelski')) return 'text-orange-500 border-orange-500/30';
    if (t.includes('senacki')) return 'text-purple-600 border-purple-600/30';
    if (t.includes('prezydencki')) return 'text-yellow-600 dark:text-yellow-400 border-yellow-600/30';
    return 'text-accent-blue border-border-base'; // Default
};

const getProcessBadge = (type?: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('poselski')) return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (t.includes('rządowy')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (t.includes('obywatelski')) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    if (t.includes('senacki')) return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    if (t.includes('prezydencki')) return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    return 'bg-black/5 dark:bg-white/5 text-secondary border-border-base';
};

export default function BillsList() {
    const { term } = useTerm();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const typeParam = searchParams.get('type') || '';

    const [query, setQuery] = useState(queryParam);
    const [page, setPage] = useState(0);
    const limit = 20;

    const { processes, totalCount, loading } = useBillsList(term, page, limit, query, typeParam);

    const handleTypeSelect = (type: string) => {
        const params: Record<string, string> = { q: query };
        if (type) params.type = type;
        setSearchParams(params, { preventScrollReset: true });
        setPage(0);
    };

    const handlePrev = () => {
        setPage(p => Math.max(0, p - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' }); // or remove if we want pure preventScrollReset
    };

    const handleNext = () => {
        setPage(p => p + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Note: handleSearch should also have preventScrollReset
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (query.trim()) params.q = query;
        if (typeParam) params.type = typeParam;
        setSearchParams(params, { preventScrollReset: true });
        setPage(0);
    };

    return (
        <div className="min-h-screen bg-page px-4 pt-24 pb-12 transition-all duration-500">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
                <SEO
                    title="Projekty Ustaw"
                    description="Monitoruj proces legislacyjny. Zobacz najnowsze projekty ustaw, druki sejmowe i postęp prac w Sejmie."
                />

                {/* Header & Controls */}
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tighter">
                                Projekty <span className="text-accent-blue italic font-serif">Ustaw</span>
                            </h1>
                            <p className="text-xl text-secondary max-w-2xl font-medium opacity-60">
                                Przeglądaj najnowsze procesy legislacyjne w Sejmie {term === 9 ? 'IX' : 'X'} kadencji.
                            </p>
                        </div>
                        <TermSwitcher />
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-surface p-6 rounded-[var(--radius-card-xl)] border border-border-base shadow-xl">
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="relative flex items-center gap-4">
                                <Search className="text-secondary/30" size={24} />
                                <input
                                    type="text"
                                    placeholder="Szukaj projektu (np. 'prawo budowlane')..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-transparent text-lg font-bold text-primary placeholder:text-slate-400 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-accent-blue text-white font-black rounded-lg uppercase tracking-wider text-xs hover:bg-black transition-colors"
                                >
                                    Szukaj
                                </button>
                            </div>
                        </form>

                        <div className="flex flex-col md:flex-row md:items-center gap-4 border-t border-border-base/40 pt-4">
                            <span className="text-[10px] font-black text-secondary uppercase tracking-widest flex items-center gap-2 opacity-50">
                                <Filter size={12} /> Filtruj:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Wszystkie', value: '' },
                                    { label: 'Poselskie', value: 'poselski' },
                                    { label: 'Rządowe', value: 'rzadowy' },
                                    { label: 'Obywatelskie', value: 'obywatelski' },
                                    { label: 'Senackie', value: 'senacki' }
                                ].map((filter) => (
                                    <button
                                        key={filter.value}
                                        onClick={() => handleTypeSelect(filter.value)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${typeParam === filter.value
                                            ? 'bg-accent-blue text-white border-accent-blue'
                                            : filter.value === '' && !typeParam
                                                ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white border-transparent shadow-lg shadow-slate-900/20'
                                                : 'bg-transparent text-secondary border-border-base hover:border-accent-blue hover:text-accent-blue'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center py-24">
                            <div className="text-secondary text-sm font-black tracking-[0.3em] uppercase animate-pulse">Ładowanie projektów...</div>
                        </div>
                    )}

                    {!loading && processes.length === 0 && (
                        <div className="text-center py-24 bg-surface rounded-3xl border border-border-base">
                            <p className="text-secondary font-medium">Brak wyników spełniających kryteria.</p>
                        </div>
                    )}

                    {(processes as Process[]).map((process: Process) => {
                        const typeColorClass = getProcessColor(process.type);
                        const typeBadgeClass = getProcessBadge(process.type);

                        return (
                            <div
                                key={process.documentId}
                                className={`block bg-surface rounded-3xl border border-border-base hover:shadow-2xl transition-all group overflow-hidden relative`}
                            >
                                {/* Left colored border indicator */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${typeColorClass.split(' ')[0].replace('text-', 'bg-')}`} />

                                <Link to={`/ustawy/${process.documentId}`} className="block p-8 group/link pl-10">
                                    <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-widest">
                                                <span className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-border-base">
                                                    <FileText size={14} className={typeColorClass.split(' ')[0]} />
                                                    {process.documentId ? `Druk ${process.documentId}` : 'Bez druku'}
                                                </span>
                                                {process.type && (
                                                    <span className={`px-3 py-1.5 rounded-full border ${typeBadgeClass}`}>
                                                        {process.type}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-2">
                                                    <Calendar size={14} />
                                                    {process.processStartDate}
                                                </span>
                                            </div>
                                            <h3 className="text-xl md:text-2xl font-black text-primary group-hover/link:text-accent-blue transition-colors line-clamp-2 leading-tight">
                                                {process.title}
                                            </h3>
                                            {process.description && (
                                                <p className="text-secondary/60 mt-4 line-clamp-3 text-base font-medium leading-relaxed italic">
                                                    {process.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-2 md:mt-0 flex items-center text-accent-blue font-black text-xs uppercase tracking-widest whitespace-nowrap group-hover/link:translate-x-1 transition-transform bg-accent-blue/5 px-4 py-2 rounded-full border border-accent-blue/10">
                                            Szczegóły <ArrowRight size={14} className="ml-2" />
                                        </div>
                                    </div>
                                </Link>

                                <div className="px-8 pb-6 pt-0 flex items-center justify-between border-t border-border-base/50 mt-4 pt-4 ml-2">
                                    <Link
                                        to={`/mapa/${process.documentId}`}
                                        className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all z-10 border border-transparent hover:border-purple-500/20"
                                    >
                                        <Network size={16} />
                                        Mapa Myśli
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="flex justify-between items-center mt-12 pt-8 border-t border-border-base">
                    <button
                        onClick={handlePrev}
                        disabled={page === 0 || loading}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-secondary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={20} />
                        Poprzednie
                    </button>
                    <span className="text-accent-blue bg-accent-blue/10 px-4 py-2 rounded-full border border-accent-blue/20 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/5">
                        Strona {page + 1}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={loading || (totalCount !== null && (page + 1) * limit >= totalCount)}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-secondary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Następne
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
