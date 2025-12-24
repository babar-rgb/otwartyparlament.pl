import { useState } from 'react';
import { Search, FileText, Loader2, ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTerm } from '../context/TermContext';
import { useSejmPrints } from '../hooks/useSejmPrints';

export default function Projekty() {
    const { term } = useTerm();
    const {
        filteredPrints,
        loading,
        searchTerm,
        setSearchTerm,
        filterSource,
        setFilterSource,
        startIndex,
        setStartIndex,
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
        const colorMap: Record<string, string> = {
            'projekt ustawy': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            'sprawozdanie': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'informacja / raport': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            'projekt uchwały': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
            'ustawa budżetowa': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'dokument / inny': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        };
        return {
            label: type.toUpperCase(),
            color: colorMap[type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'
        };
    };

    const cleanText = (text?: string) => {
        if (!text) return '';
        return text
            .replace(/\*/g, '') // Remove all asterisks
            .replace(/\[\d+\]/g, '') // Remove citation artifacts like [1], [2]
            .replace(/ġ/g, 'ł') // Fix encoding issue
            .replace(/^Oto .*?:/i, '') // Remove "Oto opracowanie:", "Oto streszczenie:"
            .replace(/^Poniżej .*?:/i, '') // Remove "Poniżej znajduje się..."
            .replace(/---/g, '') // Remove horizontal lines
            .replace(/::/g, ':') // Remove double colons
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
                            {/* Source Filters */}
                            {[
                                { label: 'Wszystkie', value: null },
                                { label: 'Rządowe', value: 'rządowy' },
                                { label: 'Poselskie', value: 'poselski' },
                                { label: 'Obywatelskie', value: 'obywatelski' },
                                { label: 'Senackie', value: 'senacki' },
                            ].map((f) => (
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
                            {[
                                { label: 'Projekt Ustawy', color: 'bg-indigo-500' },
                                { label: 'Sprawozdanie', color: 'bg-amber-500' },
                                { label: 'Raport / Info', color: 'bg-cyan-500' },
                                { label: 'Projekt Uchwały', color: 'bg-pink-500' },
                                { label: 'Ustawa Budżetowa', color: 'bg-emerald-500' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-2.5">
                                    <div className={`w-2 h-2 rounded-full ring-2 ring-white/5 ${item.color}`}></div>
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
                ) : filteredPrints.length === 0 ? (
                    <div className="text-center py-32 bg-[#111126] rounded-[2.5rem] border border-white/5 border-dashed">
                        <FileText size={64} className="mx-auto text-white/10 mb-6" />
                        <h3 className="text-2xl font-black text-white mb-2">Brak wyników</h3>
                        <p className="text-white/40 font-medium">Spróbuj zmienić filtry lub wyszukać inną frazę.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredPrints.slice(startIndex, startIndex + ITEMS_PER_PAGE).map((print) => {
                            const isExpanded = expandedPrint === print.number;
                            const hasInsight = !!print.ai_summary;

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
                                                {print.document_type && (
                                                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-white/5 ${getDocumentTypeBadge(print.document_type)?.color.replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                                        {getDocumentTypeBadge(print.document_type)?.label}
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

                {!loading && filteredPrints.length === 0 && (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Brak wyników</h3>
                        <p className="text-slate-500">Spróbuj zmienić filtry lub wyszukać inną frazę.</p>
                    </div>
                )}

                {!loading && filteredPrints.length > ITEMS_PER_PAGE && (
                    <div className="mt-16 p-10 bg-[#111126] text-white rounded-[3rem] shadow-2xl border border-white/5 animate-fade-in-up">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between mb-6 px-2">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Najnowsze druki</span>
                                    <div className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 uppercase tracking-widest">
                                        Przedział: <span className="text-white">{filteredPrints[startIndex]?.number}</span> — <span className="text-white">{filteredPrints[Math.min(startIndex + ITEMS_PER_PAGE - 1, filteredPrints.length - 1)]?.number}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Starsze druki</span>
                                </div>
                                <div className="relative h-12 flex items-center">
                                    <input
                                        type="range"
                                        min="0"
                                        max={Math.max(0, filteredPrints.length - ITEMS_PER_PAGE)}
                                        step={ITEMS_PER_PAGE}
                                        value={startIndex}
                                        onChange={(e) => {
                                            setStartIndex(parseInt(e.target.value));
                                            window.scrollTo({ top: 400, behavior: 'smooth' });
                                        }}
                                        className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                                    />
                                </div>
                                <div className="flex justify-between mt-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] px-2">
                                    <span>Początek {term} kadencji</span>
                                    <span>Przesuń, aby cofnąć się w czasie</span>
                                </div>
                            </div>

                            <div className="bg-black/20 px-10 py-8 rounded-[2rem] border border-white/5 text-center shrink-0 shadow-inner min-w-[240px]">
                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">Strona katalogu</div>
                                <div className="text-4xl font-black text-white flex items-center justify-center gap-3">
                                    {Math.floor(startIndex / ITEMS_PER_PAGE) + 1}
                                    <span className="text-white/10 font-medium text-2xl">/</span>
                                    <span className="text-white/40 font-medium text-2xl">{Math.ceil(filteredPrints.length / ITEMS_PER_PAGE)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && filteredPrints.length > 0 && (
                    <div className="text-center mt-8 text-slate-500 text-sm font-medium">
                        Pokazano {Math.min(ITEMS_PER_PAGE, filteredPrints.length - startIndex)} z {filteredPrints.length} dostępnych druków.
                    </div>
                )}
            </div>
        </div>
    );
}
