import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, FileText, ExternalLink, Filter, Loader2, ScrollText } from 'lucide-react';

interface SejmPrint {
    number: string;
    title: string;
    summary: string | null;
    process_id: string | null;
}

export default function Projekty() {
    const [prints, setPrints] = useState<SejmPrint[]>([]);
    const [filteredPrints, setFilteredPrints] = useState<SejmPrint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);

    useEffect(() => {
        fetchPrints();
    }, []);

    useEffect(() => {
        filterData();
    }, [searchTerm, filterSource, prints]);

    const fetchPrints = async () => {
        setLoading(true);
        try {
            // Fetch all (limit 1500 for now to avoid huge payload, or pagination later)
            // Ideally order by number. Since number is text, standard sort might be 1, 10, 2...
            // We'll sort via JS for better precision or just reliable simple search
            const { data, error } = await supabase
                .from('sejm_prints')
                .select('*')
                .limit(2000);

            if (error) throw error;

            // Sort by number descending (attempt to parse number)
            const sorted = (data || []).sort((a, b) => {
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

    const getSourceBadge = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('rządowy')) return { label: 'Rządowy', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        if (t.includes('poselski')) return { label: 'Poselski', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        if (t.includes('senacki')) return { label: 'Senacki', color: 'bg-orange-100 text-orange-700 border-orange-200' };
        if (t.includes('obywatelski')) return { label: 'Obywatelski', color: 'bg-green-100 text-green-700 border-green-200' };
        if (t.includes('komisyjny')) return { label: 'Komisyjny', color: 'bg-slate-100 text-slate-700 border-slate-200' };
        if (t.includes('prezydent')) return { label: 'Prezydencki', color: 'bg-red-100 text-red-700 border-red-200' };
        return null;
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                    <ScrollText size={40} className="text-blue-600" />
                    Projekty Ustaw
                </h1>
                <p className="text-slate-600 max-w-2xl text-lg">
                    Przeglądaj wszystkie druki sejmowe X kadencji. Zobacz nad czym pracują politycy, zanim trafi to pod głosowanie.
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 sticky top-20 z-30">
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
                        const badge = getSourceBadge(print.title);
                        return (
                            <div key={print.number} className="bg-white p-5 rounded-xl border border-slate-200 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="flex items-start gap-4">
                                    <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 bg-slate-100 rounded-lg shrink-0">
                                        <span className="text-xs text-slate-500 uppercase font-bold">Druk</span>
                                        <span className="text-xl font-bold text-slate-700">{print.number}</span>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="md:hidden text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                Nr {print.number}
                                            </span>
                                            {badge && (
                                                <span className={`text-xs font-bold px-2 py-1 rounded border ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-slate-900 mb-2 leading-relaxed group-hover:text-blue-600 transition-colors">
                                            {print.title}
                                        </h3>

                                        <div className="flex items-center gap-4 mt-4">
                                            <a
                                                href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${print.number}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                Otwórz w PDF <ExternalLink size={14} />
                                            </a>
                                            {/* Process Link if avail */}
                                            {/* Future: Link to /mapa/:id if we joined with processes table */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && filteredPrints.length > 100 && (
                <div className="text-center mt-8 text-slate-500 text-sm">
                    Pokazano 100 z {filteredPrints.length} wyników. Użyj wyszukiwarki, aby znaleźć konkretny projekt.
                </div>
            )}
        </div>
    );
}
