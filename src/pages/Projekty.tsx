import { useState } from 'react';
import { Search, FileText, Loader2, ChevronDown, ChevronUp, Sparkles, Target } from 'lucide-react';
import TermSwitcher from '../components/ui/TermSwitcher';
import Skeleton from '../components/ui/Skeleton';
import { useTerm } from '../context/TermContext';
import { useSejmPrints } from '../hooks/useSejmPrints';
import { PRINT_CATEGORIES, DEFAULT_PRINT_STYLE, PRINT_SOURCE_FILTERS } from '../constants';

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

    const toggleExpand = (number: string) => {
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
        <div className="min-h-screen bg-page pb-12 font-sans transition-all duration-500">
            {/* Hero Section */}
            <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden bg-page">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-blue/10 text-accent-blue rounded-full font-bold text-[10px] uppercase tracking-wider mb-6 border border-accent-blue/20">
                                <Target size={14} />
                                <span>Baza Legislatywna v1.0</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tight leading-tight">
                                Projekty i Dokumenty <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-indigo-500 underline decoration-accent-blue/20 underline-offset-8 italic font-serif opacity-90">Sejmowe.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-secondary max-w-2xl leading-relaxed">
                                Przeglądaj pełną bazę druków sejmowych {term}. kadencji. Dokumenty są automatycznie analizowane pod kątem skutków prawnych i kluczowych zmian.
                            </p>
                        </div>
                        <div className="shrink-0 pb-2">
                            <TermSwitcher />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto mb-10 px-4 md:px-8">
                <div className="bg-surface p-8 md:p-10 rounded-[2.5rem] border border-border-base shadow-sm">
                    <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary/40 group-focus-within:text-accent-blue transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Szukaj projektu (tytuł, numer druku)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-14 pr-4 py-5 bg-page border border-border-base rounded-[1.5rem] text-primary placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue/50 transition-all font-medium text-lg"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                            {PRINT_SOURCE_FILTERS.map((f) => (
                                <button
                                    key={f.label}
                                    onClick={() => setFilterSource(f.value)}
                                    className={`px-8 py-5 rounded-[1.25rem] font-bold text-xs uppercase tracking-widest whitespace-nowrap transition-all border ${filterSource === f.value
                                        ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                                        : 'bg-page text-secondary border-border-base hover:bg-surface hover:text-primary hover:border-secondary/20'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="pt-6 border-t border-border-base flex flex-wrap items-center gap-x-10 gap-y-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-30">Kategorie dokumentów:</span>
                        {Object.entries(PRINT_CATEGORIES).map(([key, style]) => (
                            <div key={key} className="flex items-center gap-2.5 group">
                                <div className={`w-3 h-3 rounded-full ${style.color.split(' ')[0]} border border-white/10 group-hover:scale-125 transition-transform`} />
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider group-hover:text-primary transition-colors">{style.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-40">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <Loader2 className="animate-spin text-accent-blue" size={48} />
                                <div className="absolute inset-0 bg-accent-blue/20 blur-xl animate-pulse rounded-full" />
                            </div>
                            <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px]">Wczytywanie dokumentów</span>
                        </div>
                    </div>
                ) : prints.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-surface rounded-[3rem] border border-border-base border-dashed space-y-4">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center">
                            <Search className="text-rose-400" size={32} />
                        </div>
                        <div className="text-secondary text-lg font-medium italic">Nie znaleziono druków spełniających kryteria.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {prints.map((print) => {
                            const isExpanded = expandedPrint === print.number;
                            const hasInsight = !!print.ai_summary;
                            const badge = getDocumentTypeBadge(print.document_type);

                            return (
                                <div
                                    key={print.number}
                                    onClick={() => toggleExpand(print.number)}
                                    className={`p-8 rounded-[2.5rem] bg-surface border transition-all cursor-pointer group relative overflow-hidden mb-6 ${isExpanded ? 'border-accent-blue shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] ring-1 ring-accent-blue/20' : 'border-border-base hover:border-secondary/20 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 rounded-[1.5rem] shrink-0 transition-all bg-black/5 dark:bg-white/5 group-hover:bg-accent-blue group-hover:text-white text-secondary">
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-40 group-hover:opacity-80">Druk</span>
                                            <span className="text-2xl font-black">{print.number}</span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <span className="md:hidden text-xs font-black bg-black/5 dark:bg-white/5 text-secondary px-3 py-1 rounded-full">
                                                    DRUK {print.number}
                                                </span>
                                                {badge && (
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5 ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-black text-primary mb-3 leading-tight group-hover:text-accent-blue transition-colors">
                                                {print.title}
                                            </h3>

                                            {/* Minified view props */}
                                            {!isExpanded && hasInsight && (
                                                <p className="text-secondary text-sm leading-relaxed font-medium line-clamp-2 mt-4 italic">
                                                    {cleanText(print.ai_summary)}
                                                </p>
                                            )}

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="mt-8 pt-8 border-t border-border-base animate-fade-in-down">
                                                    {hasInsight ? (
                                                        <div className="space-y-6 text-left">
                                                            <div className="relative overflow-hidden bg-page p-8 md:p-10 rounded-[2.5rem] border border-border-base shadow-sm">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10 relative z-10">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                                                                            <Sparkles size={24} />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-2xl font-bold text-primary tracking-tight">
                                                                                Analiza Merytoryczna
                                                                            </h4>
                                                                            <p className="text-xs text-secondary font-medium uppercase tracking-widest opacity-60">System Analizy Legislacyjnej AI</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="sm:ml-auto">
                                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue rounded-full border border-accent-blue/20 text-[10px] font-black uppercase tracking-widest">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                                                                            AI Premium Insight
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-4 relative z-10">
                                                                    {cleanText(print.ai_summary || '').split(/\d+\./).map(p => p.trim()).filter(Boolean).map((point, idx) => (
                                                                        <div key={idx} className="flex gap-6 p-4 rounded-2xl hover:bg-surface transition-colors border border-transparent hover:border-border-base group/point">
                                                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface border border-border-base flex items-center justify-center text-accent-blue font-black text-sm group-hover/point:bg-accent-blue group-hover/point:text-white transition-all shadow-sm">
                                                                                {idx + 1}
                                                                            </div>
                                                                            <div className="flex-1 text-secondary leading-relaxed text-[15px] font-medium pt-1">
                                                                                {point}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {!print.ai_summary && print.summary && (
                                                                        <div className="text-secondary leading-relaxed whitespace-pre-wrap text-[15px] font-medium p-4 italic">
                                                                            {print.summary}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Bottom Label */}
                                                                <div className="mt-10 pt-6 border-t border-border-base flex items-center justify-between text-[10px] font-bold text-secondary opacity-30 uppercase tracking-[0.2em]">
                                                                    <span>Automatyczna weryfikacja dokumentu</span>
                                                                    <span>Kadencja {term} · Sejm RP</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-400 italic text-sm mb-4">
                                                            Brak automatycznej analizy dla tego projektu.
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 mt-8">
                                                        {print.number && print.number !== 'null' && (
                                                            <a
                                                                href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${print.number}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="inline-flex items-center gap-2 px-6 py-3 bg-page hover:bg-surface text-primary rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-border-base shadow-lg"
                                                            >
                                                                <FileText size={18} />
                                                                Otwórz źródłowy PDF
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="self-start mt-1 text-slate-400">
                                            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && totalCount > ITEMS_PER_PAGE && (
                    <div className="mt-16 p-10 bg-surface text-primary rounded-[3rem] shadow-2xl border border-border-base animate-fade-in-up">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="flex-1 w-full flex items-center gap-8 justify-center lg:justify-start">
                                <button
                                    onClick={() => {
                                        setPage(p => Math.max(0, p - 1));
                                        window.scrollTo({ top: 400, behavior: 'smooth' });
                                    }}
                                    disabled={page === 0}
                                    className="px-6 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 rounded-xl font-bold uppercase tracking-wider transition-all"
                                >
                                    Poprzednia
                                </button>

                                <span className="text-sm font-black uppercase tracking-widest text-secondary opacity-40">
                                    Strona <span className="text-primary text-lg mx-2">{page + 1}</span> z {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                                </span>

                                <button
                                    onClick={() => {
                                        setPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE) - 1, p + 1));
                                        window.scrollTo({ top: 400, behavior: 'smooth' });
                                    }}
                                    disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE) - 1}
                                    className="px-6 py-3 bg-accent-blue hover:brightness-110 disabled:opacity-30 text-white rounded-xl font-bold uppercase tracking-wider transition-all"
                                >
                                    Następna
                                </button>
                            </div>

                            <div className="bg-black/5 dark:bg-black/20 px-10 py-8 rounded-[2rem] border border-border-base text-center shrink-0 shadow-inner min-w-[240px]">
                                <div className="text-[10px] font-black text-secondary opacity-20 uppercase tracking-[0.2em] mb-2">Łącznie dokumentów</div>
                                <div className="text-4xl font-black text-primary flex items-center justify-center gap-3">
                                    {totalCount}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
