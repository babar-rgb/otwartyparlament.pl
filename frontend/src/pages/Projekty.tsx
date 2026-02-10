
import { Search, FileText, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import TermSwitcher from '../components/ui/TermSwitcher';

import { useSejmPrints } from '../hooks/useSejmPrints';
import { PRINT_SOURCE_FILTERS } from '../constants';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/SEO';

export default function Projekty() {

    const {
        prints, // Now contains only the current page's items
        loading,
        searchTerm,
        setSearchTerm,
        filterSource,
        setFilterSource,
        page,
        setPage,
        totalCount,
        ITEMS_PER_PAGE
    } = useSejmPrints();



    // Helper to derive type from title if backend data is missing
    const derivedType = (title: string, rawType?: string) => {
        if (rawType && rawType.length > 1) return rawType;
        const t = title.toLowerCase();
        if (t.includes('poselski')) return 'Poselski';
        if (t.includes('rządowy')) return 'Rządowy';
        if (t.includes('obywatelski')) return 'Obywatelski';
        if (t.includes('senacki') || t.includes('senatu')) return 'Senacki';
        if (t.includes('komisyjny') || t.includes('komisji')) return 'Komisyjny';
        if (t.includes('prezydencki')) return 'Prezydencki';
        return 'Inny';
    };

    // Style configuration matching VotesList
    const getProjectStyles = (type: string) => {
        const t = type.toLowerCase();

        // Rządowy -> Emerald (Green) like "Health/Work" in Votes
        if (t.includes('rządowy')) return {
            bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            gradient: 'from-emerald-500 to-teal-500',
            badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
            iconColor: 'bg-emerald-500/10 text-emerald-600'
        };
        // Poselski -> Blue/Cyan like "Economy" in Votes
        if (t.includes('poselski')) return {
            bg: 'bg-blue-50/50 dark:bg-blue-900/10',
            border: 'border-blue-200 dark:border-blue-500/20',
            text: 'text-blue-600 dark:text-blue-400',
            gradient: 'from-blue-500 to-cyan-500',
            badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
            iconColor: 'bg-blue-500/10 text-blue-600'
        };
        // Obywatelski -> Orange like "Agriculture" in Votes
        if (t.includes('obywatelski')) return {
            bg: 'bg-orange-50/50 dark:bg-orange-900/10',
            border: 'border-orange-200 dark:border-orange-500/20',
            text: 'text-orange-600 dark:text-orange-400',
            gradient: 'from-yellow-500 to-orange-500',
            badge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300',
            iconColor: 'bg-orange-500/10 text-orange-600'
        };
        // Senacki/Prezydencki -> Purple like "State/Law" in Votes
        if (t.includes('senacki') || t.includes('prezydencki')) return {
            bg: 'bg-purple-50/50 dark:bg-purple-900/10',
            border: 'border-purple-200 dark:border-purple-500/20',
            text: 'text-purple-600 dark:text-purple-400',
            gradient: 'from-purple-500 to-pink-500',
            badge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300',
            iconColor: 'bg-purple-500/10 text-purple-600'
        };

        // Default / Komisyjny -> Gray/Slate
        return {
            bg: 'bg-surface hover:bg-black/5 dark:hover:bg-white/5',
            border: 'border-border-base',
            text: 'text-secondary',
            gradient: 'from-slate-500 to-slate-400',
            badge: 'bg-black/5 text-secondary border-border-base',
            iconColor: 'bg-black/5 dark:bg-white/5 text-secondary'
        };
    };

    const cleanText = (text?: string) => {
        if (!text) return '';
        return text
            .replace(/\*/g, '')
            .replace(/\[\d+\]/g, '')
            .replace(/ġ/g, 'ł')
            .replace(/^Oto .*?:/i, '')
            .replace(/^Poniżej .*?:/i, '')
            .replace(/---/g, '')
            .replace(/::/g, ':')
            .trim();
    };

    return (
        <>
            <SEO
                title="Projekty Ustaw - Baza Legislacyjna"
                description="Pełna baza projektów ustaw procesowanych w Sejmie X kadencji. Śledź postępy prac legislacyjnych, od złożenia projektu po podpis Prezydenta."
            />
            <div className="min-h-screen bg-page dashboard-mesh text-primary pt-32 pb-24 px-4 md:px-8 font-sans transition-all duration-500">
                <div className="animate-fade-in">
                    {/* Hero Section */}
                    <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base bg-page">
                        <div className="max-w-7xl mx-auto relative z-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                                <div className="flex-1">
                                    <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                                        Baza <span className="italic font-serif text-accent-blue/80">Legislacyjna</span>
                                    </h1>
                                    <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                                        Przeglądaj <span className="text-primary font-black">{totalCount > 0 ? totalCount.toLocaleString() : '...'}</span> projektów ustaw i uchwał.
                                        AI analizuje każdy dokument, byś nie musiał czytać żargonu.
                                    </p>
                                </div>
                                <div className="shrink-0 pb-2">
                                    <TermSwitcher />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
                        {/* Search Panel */}
                        <div className="bg-surface p-6 rounded-[var(--radius-card-xl)] border border-border-base mb-10 shadow-2xl backdrop-blur-md">
                            <div className="relative group">
                                <div className="relative flex flex-col md:flex-row items-center gap-4">
                                    <div className="relative flex-1 w-full flex items-center gap-4">
                                        <Search className="text-secondary/30 hidden md:block" size={24} />
                                        <input
                                            type="text"
                                            placeholder="Szukaj projektu (tytuł, numer druku)..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-slate-400 focus:outline-none py-2"
                                        />
                                    </div>
                                    <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                        {PRINT_SOURCE_FILTERS.map((f) => (
                                            <button
                                                key={f.label}
                                                onClick={() => setFilterSource(f.value)}
                                                className={`px-4 py-2 rounded-[var(--radius-badge)] font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${filterSource === f.value
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                    : 'bg-page text-secondary border-border-base hover:bg-surface hover:text-primary'
                                                    }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-base/50">
                                <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                                    <FileText className="text-accent-blue" />
                                    {searchTerm ? `Wyniki wyszukiwania: "${searchTerm}"` : 'Najnowsze projekty'}
                                </h2>
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center py-40">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <Loader2 className="animate-spin text-accent-blue" size={48} />
                                        </div>
                                        <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px]">Przeszukiwanie bazy</span>
                                    </div>
                                </div>
                            ) : prints.length === 0 ? (
                                <EmptyState
                                    title="Brak projektów"
                                    description="Nie znaleziono dokumentów spełniających kryteria."
                                    icon="search"
                                />
                            ) : (
                                <div className="grid gap-4">
                                    {prints.map((print) => {

                                        const hasInsight = !!print.ai_summary;

                                        // Robust type resolution
                                        const resolvedType = derivedType(print.title, print.document_type || print.type);
                                        const styles = getProjectStyles(resolvedType);

                                        return (
                                            <Link
                                                key={print.number}
                                                to={`/projekty/${print.id || print.number}`}
                                                className={`group bg-surface hover:bg-hover border transition-all shadow-sm hover:shadow-xl hover:shadow-accent-blue/5 p-6 rounded-[var(--radius-card-md)] relative block ${styles.border} ${styles.bg}`}
                                            >

                                                <div className="flex flex-col md:flex-row gap-6 items-start">

                                                    {/* Icon Box */}
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-transparent ${styles.iconColor}`}>
                                                        <FileText size={24} />
                                                    </div>

                                                    <div className="flex-1 w-full">
                                                        {/* Header Badges */}
                                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                                            {print.number && (
                                                                <object>
                                                                    <a
                                                                        href={`https://www.sejm.gov.pl/Sejm${print.term || 10}.nsf/druk.xsp?nr=${print.number}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="px-2.5 py-1 bg-white/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg border border-border-base/50 hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue/30 transition-all z-20 relative"
                                                                    >
                                                                        Druk {print.number}
                                                                    </a>
                                                                </object>
                                                            )}
                                                            {/* Source Badge */}
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent ${styles.badge}`}>
                                                                {resolvedType}
                                                            </span>
                                                        </div>

                                                        <h3 className="text-xl font-bold text-primary group-hover:text-accent-blue transition-colors leading-tight mb-4 flex items-center justify-between gap-4">
                                                            {print.title}
                                                            <ArrowRight size={20} className="text-accent-blue opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all shrink-0" />
                                                        </h3>

                                                        {/* AI Insight Preview */}
                                                        {hasInsight && (
                                                            <div className="mb-0 pl-4 border-l-2 border-accent-blue/20">
                                                                <p className="text-secondary text-sm font-medium line-clamp-2 leading-relaxed">
                                                                    <Sparkles size={12} className="inline mr-2 text-accent-blue" />
                                                                    {cleanText(print.ai_summary)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {!loading && totalCount > ITEMS_PER_PAGE && (
                                <div className="flex justify-center items-center gap-4 pt-8">
                                    <button
                                        onClick={() => {
                                            setPage(p => Math.max(0, p - 1));
                                            window.scrollTo({ top: 300, behavior: 'smooth' });
                                        }}
                                        disabled={page === 0}
                                        className="px-6 py-3 rounded-xl bg-surface border border-border-base hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-black text-xs uppercase tracking-widest"
                                    >
                                        Poprzednia
                                    </button>
                                    <span className="font-black text-sm text-secondary">
                                        Strona {page + 1}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE) - 1, p + 1));
                                            window.scrollTo({ top: 300, behavior: 'smooth' });
                                        }}
                                        disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE) - 1}
                                        className="px-6 py-3 rounded-xl bg-surface border border-border-base hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-black text-xs uppercase tracking-widest"
                                    >
                                        Następna
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
