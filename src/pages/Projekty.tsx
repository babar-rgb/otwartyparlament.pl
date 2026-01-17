import { useState } from 'react';
import { Search, FileText, Loader2, ChevronDown, ChevronUp, Sparkles, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TermSwitcher from '../components/ui/TermSwitcher';
import { useTerm } from '../context/TermContext';
import { useSejmPrints } from '../hooks/useSejmPrints';
import { PRINT_CATEGORIES, DEFAULT_PRINT_STYLE, PRINT_SOURCE_FILTERS } from '../constants';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/SEO';

export default function Projekty() {
    const { term } = useTerm();
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

    const [expandedPrint, setExpandedPrint] = useState<string | null>(null);

    const toggleExpand = (number: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigation if wrapped in Link
        e.stopPropagation();
        if (expandedPrint === number) {
            setExpandedPrint(null);
        } else {
            setExpandedPrint(number);
        }
    };

    const getDocumentTypeBadge = (type?: string) => {
        if (!type) return null;
        const style = PRINT_CATEGORIES[type as keyof typeof PRINT_CATEGORIES] || DEFAULT_PRINT_STYLE;
        return {
            label: style.label,
            color: style.color
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
                    {/* Hero Section - Matching InterpellationsList */}
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
                        {/* Search Panel - Matching InterpellationsList */}
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
                                                    ? 'bg-primary text-page border-primary'
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
                                <div className="grid gap-6">
                                    {prints.map((print) => {
                                        const isExpanded = expandedPrint === print.number;
                                        const hasInsight = !!print.ai_summary;
                                        const badge = getDocumentTypeBadge(print.document_type);

                                        return (
                                            <div key={print.number} className="group bg-surface rounded-[var(--radius-card-md)] border border-border-base shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                                                {/* Hover Accent Line */}
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="p-6 md:p-8">
                                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-accent-blue border border-border-base/50 shrink-0">
                                                                <FileText size={22} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-black text-secondary opacity-50 uppercase tracking-widest">
                                                                        Druk nr {print.number}
                                                                    </span>
                                                                    {badge && (
                                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${badge.color.replace('text-', 'border-').replace('bg-', 'text-')}`}>
                                                                            {badge.label}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h3 className="text-xl md:text-2xl font-black text-primary leading-tight group-hover:text-accent-blue transition-colors mt-1">
                                                                    {print.title}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Mini Summary / Content Snippet */}
                                                    <div className="mb-6 pl-0 md:pl-16">
                                                        {hasInsight ? (
                                                            <p className="text-secondary leading-relaxed text-sm font-medium line-clamp-2">
                                                                <Sparkles size={12} className="inline mr-2 text-accent-blue" />
                                                                {cleanText(print.ai_summary)}
                                                            </p>
                                                        ) : (
                                                            <p className="text-secondary/50 leading-relaxed text-sm italic font-medium line-clamp-2">
                                                                Brak automatycznego streszczenia. Kliknij szczegóły, aby zobaczyć dokument.
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions Footer */}
                                                    <div className="flex items-center justify-between pl-0 md:pl-16 border-t border-border-base/50 pt-4">
                                                        <button
                                                            onClick={(e) => toggleExpand(print.number, e)}
                                                            className="flex items-center gap-2 text-xs font-bold text-secondary hover:text-primary transition-colors uppercase tracking-wider"
                                                        >
                                                            {isExpanded ? (
                                                                <>
                                                                    <ChevronUp size={14} /> Zwiń podgląd
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown size={14} /> Szybki podgląd AI
                                                                </>
                                                            )}
                                                        </button>

                                                        <Link
                                                            to={`/projekty/${print.id || print.number}`}
                                                            className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform"
                                                        >
                                                            Pełna Analiza i Treść <ArrowRight size={14} />
                                                        </Link>
                                                    </div>

                                                    {/* Expanded AI Drawer */}
                                                    {isExpanded && (
                                                        <div className="mt-6 pl-0 md:pl-16 pt-6 border-t border-border-base animate-fade-in-down">
                                                            {hasInsight ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-page/50 p-6 rounded-2xl border border-border-base">
                                                                    <div className="md:col-span-2">
                                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Streszczenie</h4>
                                                                        <p className="text-sm font-medium leading-relaxed text-primary">
                                                                            {print.ai_summary}
                                                                        </p>
                                                                    </div>

                                                                    {(print.pros && print.pros.length > 0) && (
                                                                        <div>
                                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-2">
                                                                                <CheckCircle2 size={12} /> Zalety
                                                                            </h4>
                                                                            <ul className="space-y-2">
                                                                                {print.pros.slice(0, 3).map((p, i) => (
                                                                                    <li key={i} className="text-xs text-secondary list-disc list-inside marker:text-emerald-500">{p}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}

                                                                    {(print.cons && print.cons.length > 0) && (
                                                                        <div>
                                                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2 flex items-center gap-2">
                                                                                <AlertTriangle size={12} /> Ryzyka
                                                                            </h4>
                                                                            <ul className="space-y-2">
                                                                                {print.cons.slice(0, 3).map((c, i) => (
                                                                                    <li key={i} className="text-xs text-secondary list-disc list-inside marker:text-rose-500">{c}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8 text-secondary/50 text-xs font-bold uppercase tracking-widest">
                                                                    Analiza w toku...
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
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
