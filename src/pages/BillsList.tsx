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

export default function BillsList() {
    const [processes, setProcesses] = useState<Process[]>([]);
    const [loading, setLoading] = useState(true);
    const [offset, setOffset] = useState(0);
    const limit = 20;

    useEffect(() => {
        const fetchProcesses = async () => {
            setLoading(true);
            try {
                // Fetch processes sorted by ID descending (proxy for date) to get latest
                const response = await fetch(`https://api.sejm.gov.pl/sejm/term10/processes?limit=${limit}&offset=${offset}`);
                if (!response.ok) throw new Error('Failed to fetch processes');
                const data = await response.json();

                // The API returns an array directly
                setProcesses(data);
            } catch (error) {
                console.error('Error fetching processes:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProcesses();
    }, [offset]);

    const handleNext = () => {
        setOffset(prev => prev + limit);
        window.scrollTo(0, 0);
    };

    const handlePrev = () => {
        setOffset(prev => Math.max(0, prev - limit));
        window.scrollTo(0, 0);
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                    Projekty <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Ustaw</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl">
                    Przeglądaj najnowsze procesy legislacyjne w Sejmie X kadencji.
                </p>
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
                    disabled={offset === 0 || loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} />
                    Poprzednie
                </button>
                <span className="text-slate-400 font-mono text-sm">
                    Strona {Math.floor(offset / limit) + 1}
                </span>
                <button
                    onClick={handleNext}
                    disabled={processes.length < limit || loading}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Następne
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
