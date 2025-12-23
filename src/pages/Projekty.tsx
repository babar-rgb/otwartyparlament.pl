import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, FileText, Loader2, ScrollText, ChevronDown, ChevronUp } from 'lucide-react';

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
    const [prints, setPrints] = useState<SejmPrint[]>([]);
    const [filteredPrints, setFilteredPrints] = useState<SejmPrint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [expandedPrint, setExpandedPrint] = useState<string | null>(null);

    useEffect(() => {
        fetchPrints();
    }, []);

    useEffect(() => {
        filterData();
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


    return (
        <div className="container mx-auto px-4 pt-24 pb-12 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                    <ScrollText size={40} className="text-blue-600" />
                    Projekty i Dokumenty Sejmowe
                </h1>
                <p className="text-slate-600 max-w-2xl text-lg">
                    Przeglądaj wszystkie druki sejmowe X kadencji. Kliknij w projekt, aby zobaczyć szczegóły i uzasadnienie.
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
                    {filteredPrints.slice(0, 100).map((print) => { // Render limit for perf
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
                                                {print.ai_summary}
                                            </p>
                                        )}

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in-down">
                                                {hasInsight ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-blue-50/40 p-5 rounded-xl border border-blue-100/50 shadow-sm">
                                                            <h4 className="flex items-center gap-2 text-blue-800 font-bold mb-3 text-base">
                                                                <FileText size={18} /> Opracowanie przyjazne
                                                            </h4>
                                                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                                {print.justification_text ? print.justification_text.substring(0, 1500) + (print.justification_text.length > 1500 ? '...' : '') : print.ai_summary}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-400 italic text-sm mb-4">
                                                        Brak automatycznej analizy dla tego projektu.
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4 mt-6">
                                                    <a
                                                        href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${print.number}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                                    >
                                                        <FileText size={16} />
                                                        Otwórz źródłowy PDF
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="self-start mt-1 text-slate-400">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
            }

            {
                !loading && filteredPrints.length === 0 && (
                    <div className="text-center mt-8 text-slate-500 text-sm">
                        Brak projektów.
                    </div>
                )
            }

            {
                !loading && filteredPrints.length > 100 && (
                    <div className="text-center mt-8 text-slate-500 text-sm">
                        Pokazano 100 z {filteredPrints.length} wyników. Użyj wyszukiwarki, aby znaleźć konkretny projekt.
                    </div>
                )
            }
        </div >
    );
}

