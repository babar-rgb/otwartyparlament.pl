import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, FileText, Loader2, ScrollText, ChevronDown, ChevronUp } from 'lucide-react';
import { useTerm } from '../context/TermContext';

interface SejmPrint {
    number: string;
    title: string;
    summary: string | null;
    process_id: string | null;
    ai_summary?: string;
    justification_text?: string;
    document_type?: string;
}

export default function Projekty() {
    const { term } = useTerm();
    const [prints, setPrints] = useState<SejmPrint[]>([]);
    const [filteredPrints, setFilteredPrints] = useState<SejmPrint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [expandedPrint, setExpandedPrint] = useState<string | null>(null);
    const [startIndex, setStartIndex] = useState(0);

    const ITEMS_PER_PAGE = 100;

    useEffect(() => {
        fetchPrints();
    }, []);

    useEffect(() => {
        filterData();
        setStartIndex(0); // Reset pagination on filter
    }, [searchTerm, filterSource, prints]);

    const fetchPrints = async () => {
        setLoading(true);
        try {
            // 1. Fetch Prints
            const { data: printsData, error: printsError } = await supabase
                .from('sejm_prints')
                .select('*')
                .limit(5000);

            if (printsError) throw printsError;

            // 2. Fetch Insights
            const { data: insightsData, error: insightsError } = await supabase
                .from('bill_insights')
                .select('print_number, ai_summary, justification_text, document_type')
                .limit(5000);

            if (insightsError) console.warn("Insights fetch error (ignoring):", insightsError);

            const insightsMap = new Map(insightsData?.map((i: any) => [i.print_number, i]));

            // 3. Merge
            const merged = (printsData || []).map((p: any) => ({
                ...p,
                ai_summary: insightsMap.get(p.number)?.ai_summary,
                justification_text: insightsMap.get(p.number)?.justification_text,
                document_type: insightsMap.get(p.number)?.document_type
            }));

            // Sort by number descending (attempt to parse number)
            const sorted = merged.sort((a: any, b: any) => {
                const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
                return numB - numA;
            });

            setPrints(sorted);
        } catch (error) {
            console.error('Error fetching prints:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterData = () => {
        let result = prints;

        if (searchTerm) {
            const lowerInfo = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.title.toLowerCase().includes(lowerInfo) ||
                p.number.toLowerCase().includes(lowerInfo)
            );
        }

        if (filterSource) {
            result = result.filter(p => p.title.toLowerCase().includes(filterSource.toLowerCase()));
        }

        setFilteredPrints(result);
    };

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
            'projekt ustawy': 'bg-indigo-50 text-indigo-700 border-indigo-100',
            'sprawozdanie': 'bg-amber-50 text-amber-700 border-amber-100',
            'informacja / raport': 'bg-cyan-50 text-cyan-700 border-cyan-100',
            'projekt uchwały': 'bg-pink-50 text-pink-700 border-pink-100',
            'ustawa budżetowa': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'dokument / inny': 'bg-slate-50 text-slate-600 border-slate-100',
        };
        return {
            label: type.charAt(0).toUpperCase() + type.slice(1),
            color: colorMap[type] || 'bg-slate-50 text-slate-600 border-slate-100'
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
        <div className="container mx-auto px-4 pt-24 pb-12 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                    <ScrollText size={40} className="text-blue-600" />
                    Projekty i Dokumenty Sejmowe
                </h1>
                <p className="text-slate-600 max-w-2xl text-lg">
                    Przeglądaj wszystkie druki sejmowe {term} kadencji. Kliknij w projekt, aby zobaczyć szczegóły i uzasadnienie.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Szukaj projektu (tytuł, numer druku)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
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
                                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors border ${filterSource === f.value
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legenda typów:</span>
                        {[
                            { label: 'Projekt Ustawy', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                            { label: 'Sprawozdanie', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                            { label: 'Raport / Info', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
                            { label: 'Projekt Uchwały', color: 'bg-pink-50 text-pink-700 border-pink-100' },
                            { label: 'Ustawa Budżetowa', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full border ${item.color.split(' ').slice(1).join(' ')}`}></div>
                                <span className="text-xs font-medium text-slate-600">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </div>
            ) : filteredPrints.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Brak wyników</h3>
                    <p className="text-slate-500">Spróbuj zmienić filtry lub wyszukać inną frazę.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPrints.slice(startIndex, startIndex + ITEMS_PER_PAGE).map((print) => { // Render limit for pagination
                        const isExpanded = expandedPrint === print.number;
                        const hasInsight = !!print.ai_summary;

                        return (
                            <div
                                key={print.number}
                                onClick={() => toggleExpand(print.number)}
                                className={`bg-white p-5 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${isExpanded ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:shadow-md hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 rounded-lg shrink-0 transition-colors bg-slate-100 text-slate-700">
                                        <span className="text-xs uppercase font-bold opacity-70">Druk</span>
                                        <span className="text-xl font-bold">{print.number}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="md:hidden text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                Nr {print.number}
                                            </span>
                                            {print.document_type && (
                                                <span className={`text-xs font-bold px-2 py-1 rounded border ${getDocumentTypeBadge(print.document_type)?.color}`}>
                                                    {getDocumentTypeBadge(print.document_type)?.label}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-relaxed group-hover:text-blue-600 transition-colors">
                                            {print.title}
                                        </h3>

                                        {/* Minified view props */}
                                        {!isExpanded && hasInsight && (
                                            <p className="text-slate-500 text-sm line-clamp-2 mt-2">
                                                {cleanText(print.ai_summary)}
                                            </p>
                                        )}

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 animate-fade-in-down">
                                                {hasInsight ? (
                                                    <div className="space-y-6 text-left">
                                                        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/[0.07] via-slate-900/40 to-blue-500/[0.07] p-8 rounded-3xl border border-indigo-500/20 shadow-2xl backdrop-blur-md">
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
                                                                    <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-[15px]">
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
                                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-lg"
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
                <div className="mt-12 p-8 bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 w-full">
                            <div className="flex justify-between mb-4 px-1">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Najnowsze druki</span>
                                <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                    Przedział druków: <span className="text-white">{filteredPrints[startIndex]?.number}</span> — <span className="text-white">{filteredPrints[Math.min(startIndex + ITEMS_PER_PAGE - 1, filteredPrints.length - 1)]?.number}</span>
                                </span>
                                <span className="text-xs font-black text-slate-500 uppercase tracking-tight">Starsze druki</span>
                            </div>
                            <div className="relative h-10 flex items-center">
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
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:ring-4 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1">
                                <span>Początek x kadencji</span>
                                <span>Przewiń suwak, aby cofnąć się w czasie</span>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-8 py-5 rounded-2xl border border-slate-700 text-center shrink-0 shadow-inner min-w-[200px]">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Strona katalogu</div>
                            <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                                {Math.floor(startIndex / ITEMS_PER_PAGE) + 1}
                                <span className="text-slate-600 font-medium text-xl">/</span>
                                <span className="text-slate-500 font-medium text-xl">{Math.ceil(filteredPrints.length / ITEMS_PER_PAGE)}</span>
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
    );
}
