import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, ChevronRight, ChevronLeft, ArrowRight, Network } from 'lucide-react';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/ui/TermSwitcher';
import SEO from '../components/SEO';
import { useBillsList } from '../hooks/useBillsList';

interface Process {
    number: number;
    title: string;
    description: string;
    processStartDate: string;
    documentId: string;
}

export default function BillsList() {
    const { term } = useTerm();
    const [page, setPage] = useState(0);
    const limit = 20;

    const { processes, totalCount, loading } = useBillsList(term, page, limit);

    const handleNext = () => {
        setPage(prev => prev + 1);
        window.scrollTo(0, 0);
    };

    const handlePrev = () => {
        setPage(prev => Math.max(0, prev - 1));
        window.scrollTo(0, 0);
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24 min-h-screen">
            <div className="text-secondary text-sm font-black tracking-[0.3em] uppercase animate-pulse">Przeszukiwanie bazy legislacyjnej...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-page px-4 pt-24 pb-12 transition-all duration-500">
            <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
                <SEO
                    title="Projekty Ustaw"
                    description="Monitoruj proces legislacyjny. Zobacz najnowsze projekty ustaw, druki sejmowe i postęp prac w Sejmie."
                />
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tighter">
                            Projekty <span className="text-accent-blue italic font-serif">Ustaw</span>
                        </h1>
                        <p className="text-xl text-secondary max-w-2xl font-medium opacity-60">
                            Przeglądaj najnowsze procesy legislacyjne w Sejmie {term === 9 ? 'IX' : 'X'} kadencji.
                        </p>
                    </div>
                    <TermSwitcher />
                </div>

                <div className="space-y-4">
                    {(processes as Process[]).map((process: Process) => (
                        <div
                            key={process.documentId}
                            className="block bg-surface rounded-3xl border border-border-base hover:shadow-2xl hover:border-accent-blue/30 transition-all group overflow-hidden"
                        >
                            <Link to={`/ustawy/${process.documentId}`} className="block p-8 group/link">
                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-secondary uppercase tracking-widest">
                                            <span className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-border-base">
                                                <FileText size={14} className="text-accent-blue" />
                                                {process.documentId ? `Druk ${process.documentId}` : 'Bez druku'}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {process.processStartDate}
                                            </span>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-primary group-hover/link:text-accent-blue transition-colors line-clamp-2 leading-tight">
                                            {process.title}
                                        </h3>
                                        {process.description && (
                                            <p className="text-secondary/60 mt-4 line-clamp-3 text-base font-medium leading-relaxed italic">
                                                {process.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center text-accent-blue font-black text-xs uppercase tracking-widest whitespace-nowrap group-hover/link:translate-x-1 transition-transform bg-accent-blue/5 px-4 py-2 rounded-full border border-accent-blue/10">
                                        Szczegóły <ArrowRight size={14} className="ml-2" />
                                    </div>
                                </div>
                            </Link>

                            <div className="px-8 pb-6 pt-0 flex items-center justify-between border-t border-border-base/50 mt-4 pt-4">
                                <Link
                                    to={`/mapa/${process.documentId}`}
                                    className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all z-10 border border-transparent hover:border-purple-500/20"
                                >
                                    <Network size={16} />
                                    Mapa Myśli
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-12 pt-8 border-t border-border-base">
                    <button
                        onClick={handlePrev}
                        disabled={page === 0 || loading}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-secondary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={20} />
                        Poprzednie
                    </button>
                    <span className="text-accent-blue bg-accent-blue/10 px-4 py-2 rounded-full border border-accent-blue/20 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-accent-blue/5">
                        Strona {page + 1}
                    </span>
                    <button
                        onClick={handleNext}
                        disabled={loading || (totalCount !== null && (page + 1) * limit >= totalCount)}
                        className="flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-secondary hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Następne
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
