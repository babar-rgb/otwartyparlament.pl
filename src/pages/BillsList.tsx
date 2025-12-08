import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ChevronRight, ChevronLeft, ArrowRight, Network } from 'lucide-react';

interface Process {
    number: number;
    title: string;
    description: string;
    processStartDate: string;
    documentId: string;
}

import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/TermSwitcher';
import SEO from '../components/SEO';
import { supabase } from '../lib/supabase';

export default function BillsList() {
    const { term } = useTerm(); // Use global term
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const limit = 20;

    // Fetch data locally
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Get Count
                const { count, error: countError } = await supabase
                    .from('processes')
                    // .select('*', { count: 'exact', head: true }) // HEAD not always supported via JS client simply
                    .select('id', { count: 'exact', head: true });

                if (countError) throw countError;
                setTotalCount(count);

                // Get Data
                // Order by date desc
                const { data, error } = await supabase
                    .from('processes')
                    .select('id, title, description, print_number, process_start_date')
                    .order('process_start_date', { ascending: false })
                    .range(page * limit, (page + 1) * limit - 1);

                if (error) throw error;

                // Map to Interface
                const mapped = (data || []).map(p => ({
                    number: parseInt(p.print_number || '0'), // Fallback
                    title: p.title,
                    description: p.description,
                    processStartDate: p.process_start_date,
                    documentId: p.id
                }));
                setProcesses(mapped);

            } catch (err) {
                console.error("Local fetch error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [term, page]);

    const handleNext = () => {
        setPage(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handlePrev = () => {
        setPage(prev => Math.max(0, prev - 1));
        window.scrollTo(0, 0);
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            <SEO
                title="Projekty Ustaw"
                description="Monitoruj proces legislacyjny. Zobacz najnowsze projekty ustaw, druki sejmowe i postęp prac w Sejmie."
            />
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        Projekty <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Ustaw</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl">
                        Przeglądaj najnowsze procesy legislacyjne w Sejmie {term === 9 ? 'IX' : 'X'} kadencji.
                    </p>
                </div>
                <TermSwitcher />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {processes.map((process) => (
                        <div
                            key={process.documentId}
                            className="block bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all group overflow-hidden"
                        >
                            <Link to={`/ustawy/${process.documentId}`} className="block p-6 group/link">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mb-2">
                                            <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                                <FileText size={12} />
                                                {process.documentId ? `Druk ${process.documentId}` : 'Bez druku'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {process.processStartDate}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors line-clamp-2">
                                            {process.title}
                                        </h3>
                                        {process.description && (
                                            <p className="text-slate-600 mt-2 line-clamp-2 text-sm">
                                                {process.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center text-blue-600 font-bold text-sm whitespace-nowrap group-hover/link:translate-x-1 transition-transform">
                                        Szczegóły <ArrowRight size={16} className="ml-1" />
                                    </div>
                                </div>
                            </Link>

                            {/* Actions Footer */}
                            <div className="px-6 pb-4 pt-0 flex items-center justify-between">
                                <Link
                                    to={`/mapa/${process.documentId}`}
                                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors z-10"
                                >
                                    <Network size={16} />
                                    Mapa Myśli
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
                <button
                    onClick={handlePrev}
                    disabled={page === 0 || loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} />
                    Poprzednie
                </button>
                <span className="text-slate-400 font-mono text-sm">
                    Strona {page + 1}
                </span>
                <button
                    onClick={handleNext}
                    disabled={loading || (totalCount !== null && (page + 1) * limit >= totalCount)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Następne
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
