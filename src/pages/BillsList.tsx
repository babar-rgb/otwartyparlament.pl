import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

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

export default function BillsList() {
    const { term } = useTerm(); // Use global term
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const limit = 20;

    // First, fetch total count
    useEffect(() => {
        const fetchTotalCount = async () => {
            try {
                // Fetch 1 item to get headers
                const response = await fetch(`https://api.sejm.gov.pl/sejm/term${term}/processes?limit=1`);
                const countHeader = response.headers.get('X-Total-Count');
                if (countHeader) {
                    setTotalCount(parseInt(countHeader, 10));
                }
            } catch (error) {
                console.error('Error fetching total count:', error);
            }
        };
        fetchTotalCount();
        setPage(0); // Reset page on term change
    }, [term]);

    // Then fetch data based on page and totalCount
    useEffect(() => {
        const fetchProcesses = async () => {
            if (totalCount === null) return;

            setLoading(true);
            try {
                // Calculate API offset to get latest items
                // If total is 100, limit 20.
                // Page 0: want 80-100. apiOffset = 100 - 20 * (1 + 0) = 80.

                let apiOffset = totalCount - limit * (page + 1);
                let fetchLimit = limit;

                // Handle last page (start of list)
                if (apiOffset < 0) {
                    fetchLimit = limit + apiOffset; // e.g. 20 + (-15) = 5
                    apiOffset = 0;
                }

                if (fetchLimit <= 0) {
                    setProcesses([]);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`https://api.sejm.gov.pl/sejm/term${term}/processes?limit=${fetchLimit}&offset=${apiOffset}`);
                if (!response.ok) throw new Error('Failed to fetch processes');

                const data = await response.json();

                // Reverse to show newest first
                setProcesses(data.reverse());
            } catch (error) {
                console.error('Error fetching processes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProcesses();
    }, [page, totalCount]);

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
                        <Link
                            key={process.number}
                            to={`/ustawy/${process.number}`}
                            className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
                        >
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
                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {process.title}
                                    </h3>
                                    {process.description && (
                                        <p className="text-slate-600 mt-2 line-clamp-2 text-sm">
                                            {process.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center text-blue-600 font-bold text-sm whitespace-nowrap group-hover:translate-x-1 transition-transform">
                                    Szczegóły <ArrowRight size={16} className="ml-1" />
                                </div>
                            </div>
                        </Link>
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
