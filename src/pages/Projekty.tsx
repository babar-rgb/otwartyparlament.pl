import { useState } from 'react';
import { Search, FileText, Loader2, ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
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
        <div className="min-h-screen bg-[#06060c] dashboard-mesh text-white pt-24 pb-12 px-4 md:px-8 font-sans transition-all duration-500">
            {/* Header */}
            <div className="mb-12 max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 flex items-center gap-4 tracking-tight">
                    <ScrollText size={48} className="text-blue-500" />
                    Projekty i Dokumenty Sejmowe
                </h1>
                <p className="text-white/60 max-w-2xl text-lg leading-relaxed font-medium">
                    Przeglądaj wszystkie druki sejmowe {term} kadencji. Kliknij w projekt, aby zobaczyć szczegóły i uzasadnienie.
                </p>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto mb-10">
                <div className="bg-[#111126] p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input
                                type="text"
                                placeholder="Szukaj projektu (tytuł, numer druku)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                            />
                        </div>

                        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                            {PRINT_SOURCE_FILTERS.map((f) => (
                                <button
                                    key={f.label}
                                    onClick={() => setFilterSource(f.value)}
                                    className={`px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all border ${filterSource === f.value
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                                        : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">LEGENDA TYPÓW:</span>
                            {Object.entries(PRINT_CATEGORIES).slice(0, 5).map(([key, item]) => (
                                <div key={key} className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ring-2 ring-white/5 ${item.color.split(' ')[0].replace('/10', '')}`}></div>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-40">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                            <span className="text-white/20 font-black uppercase tracking-[0.3em] text-xs">Wczytywanie dokumentów</span>
                        </div>
                    </div>
                ) : prints.length === 0 ? (
                    <div className="text-center py-32 bg-[#111126] rounded-[2.5rem] border border-white/5 border-dashed">
                        <FileText size={64} className="mx-auto text-white/10 mb-6" />
                        <h3 className="text-2xl font-black text-white mb-2">Brak wyników</h3>
                        <p className="text-white/40 font-medium">Spróbuj zmienić filtry lub wyszukać inną frazę.</p>
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
                                    className={`bg-[#111126] p-8 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${isExpanded ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-white/5 hover:border-white/10 hover:bg-[#16162d]'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="hidden md:flex flex-col items-center justify-center w-20 h-20 rounded-[1.5rem] shrink-0 transition-all bg-white/5 group-hover:bg-white/10 text-white/60">
                                            <span className="text-[10px] uppercase font-black tracking-widest opacity-40">Druk</span>
                                            <span className="text-2xl font-black">{print.number}</span>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <span className="md:hidden text-xs font-black bg-white/5 text-white/40 px-3 py-1 rounded-full">
                                                    DRUK {print.number}
                                                </span>
                                                {badge && (
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5 ${badge.color}`}>
                                                        {badge.label}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-black text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors">
                                                {print.title}
                                            </h3>

                                            {/* Minified view props */}
                                            {!isExpanded && hasInsight && (
                                                <p className="text-white/40 text-sm leading-relaxed font-medium line-clamp-2 mt-4 italic">
                                                    {cleanText(print.ai_summary)}
                                                </p>
                                            )}

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="mt-8 pt-8 border-t border-white/5 animate-fade-in-down">
                                                    {hasInsight ? (
                                                        <div className="space-y-6 text-left">
                                                            <div className="relative overflow-hidden bg-black/40 p-8 rounded-[2rem] border border-white/5 shadow-inner backdrop-blur-md">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 relative z-10">
                                                                    <div className="flex items-center gap-3">
                                                                        <div>
                                                                            <div className="text-2xl font-serif font-bold text-white tracking-tight">
                                                                                Opracowanie dokumentu
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="sm:ml-auto">
                                                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-full border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                                                            Premium Insight
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-6 relative z-10">
                                                                    {cleanText(print.ai_summary).split(/\d+\./).map(p => p.trim()).filter(Boolean).map((point, idx) => (
                                                                        <div key={idx} className="flex gap-5 group/item">
                                                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-indigo-400 font-black text-base group-hover/item:bg-indigo-600 group-hover/item:text-white group-hover/item:border-indigo-400 transition-all duration-300 shadow-xl group-hover/item:scale-110">
                                                                                {idx + 1}
                                                                            </div>
                                                                            <div className="flex-1 text-slate-300 leading-relaxed text-[15px] group-hover/item:text-white transition-colors duration-300 pt-1.5">
                                                                                {point}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {!print.ai_summary && print.summary && (
                                                                        <div className="text-white/70 leading-relaxed whitespace-pre-wrap text-[15px] font-medium">
                                                                            {print.summary}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Bottom Label */}
                                                                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                                    <span>System Analizy Danych Sejmowych</span>
                                                                    <span>Term {term} · Sejm RP</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-400 italic text-sm mb-4">
                                                            Brak automatycznej analizy dla tego projektu.
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 mt-8">
                                                        <a
                                                            href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${print.number}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 shadow-lg"
                                                        >
                                                            <FileText size={18} />
                                                            Otwórz źródłowy PDF
                                                        </a>
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
                    <div className="mt-16 p-10 bg-[#111126] text-white rounded-[3rem] shadow-2xl border border-white/5 animate-fade-in-up">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="flex-1 w-full flex items-center gap-8 justify-center lg:justify-start">
                                <button
                                    onClick={() => {
                                        setPage(p => Math.max(0, p - 1));
                                        window.scrollTo({ top: 400, behavior: 'smooth' });
                                    }}
                                    disabled={page === 0}
                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 rounded-xl font-bold uppercase tracking-wider transition-all"
                                >
                                    Poprzednia
                                </button>

                                <span className="text-sm font-black uppercase tracking-widest text-white/40">
                                    Strona <span className="text-white text-lg mx-2">{page + 1}</span> z {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                                </span>

                                <button
                                    onClick={() => {
                                        setPage(p => Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE) - 1, p + 1));
                                        window.scrollTo({ top: 400, behavior: 'smooth' });
                                    }}
                                    disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE) - 1}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:bg-blue-600 rounded-xl font-bold uppercase tracking-wider transition-all"
                                >
                                    Następna
                                </button>
                            </div>

                            <div className="bg-black/20 px-10 py-8 rounded-[2rem] border border-white/5 text-center shrink-0 shadow-inner min-w-[240px]">
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Łącznie dokumentów</div>
                                <div className="text-4xl font-black text-white flex items-center justify-center gap-3">
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
