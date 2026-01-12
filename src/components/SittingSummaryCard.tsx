
import React, { useEffect, useState } from 'react';
import { Calendar, Sparkles, ChevronRight, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTerm } from '../context/TermContext';

interface SittingSummary {
    term: number;
    sitting_number: number;
    summary_md: string;
    updated_at: string;
}

const SittingSummaryCard: React.FC = () => {
    const { term } = useTerm();
    const [summary, setSummary] = useState<SittingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchSummary = async () => {
            // Reset state when term changes
            setLoading(true);
            setError(false);
            setSummary(null);

            try {
                // Hardcoded for now to ensure it works locally
                const API_URL = "http://localhost:8000";
                console.log("Fetching sitting summary from:", `${API_URL}/sittings/latest/summary?term=${term}`);
                const response = await fetch(`${API_URL}/sittings/latest/summary?term=${term}`);
                if (!response.ok) {
                    console.error("Fetch failed with status:", response.status);
                    setError(true);
                    return;
                }
                const data = await response.json();
                console.log("Sitting summary data:", data);
                if (data.summary_md) {
                    setSummary(data);
                } else {
                    console.warn("No summary_md found in response");
                    setSummary(null);
                }
            } catch (err) {
                console.error("Failed to fetch sitting summary", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [term]);


    if (loading) return (
        <div className="mb-12 p-8 bg-surface border border-border-base rounded-[2.5rem] animate-pulse">
            <div className="h-8 bg-black/5 dark:bg-white/5 rounded-full w-1/3 mb-4"></div>
            <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full w-2/3"></div>
        </div>
    );

    if (!summary) return null;

    return (
        <div className="mb-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-purple-600/20 rounded-[2.5rem] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" />

            <div className="relative bg-[#FFFAF0] dark:bg-[#1a1625] rounded-[2.5rem] p-8 md:p-12 border border-amber-900/10 dark:border-purple-500/20 shadow-xl overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                <div className="flex flex-col md:flex-row gap-8 md:gap-12 relative z-10">
                    {/* Header Column */}
                    <div className="md:w-1/3 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/5 dark:bg-amber-500/10 text-amber-900 dark:text-amber-500 rounded-full text-xs font-black uppercase tracking-widest border border-amber-900/10">
                            <Sparkles size={14} className="animate-pulse" />
                            <span>Podsumowanie Tygodnia</span>
                        </div>

                        <div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-2 tracking-tight">
                                Raport z Sejmu
                            </h2>
                            <p className="text-amber-700 dark:text-amber-400 font-serif italic text-lg opacity-80">
                                Kluczowe decyzje i uchwały
                            </p>
                        </div>

                        <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <div className="uppercase tracking-wider text-[10px] opacity-60">Posiedzenie</div>
                                <div>Nr {summary.sitting_number} (Kadencja {summary.term})</div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Link to="/posiedzenia/historia" className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-500 transition-colors group/btn">
                                Zobacz pełną historię
                                <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Content Column */}
                    <div className="md:w-2/3">
                        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-amber-500">
                            <ReactMarkdown
                                components={{
                                    ul: ({ node, ...props }) => <ul className="space-y-4 list-none pl-0 block" {...props} />,
                                    li: ({ node, ...props }) => (
                                        <li className="relative pl-6 mb-4" {...props}>
                                            <span className="absolute left-0 top-3 w-2 h-2 rounded-full bg-amber-500 mt-0.5" />
                                            <span className="text-slate-700 dark:text-slate-300 block leading-relaxed">{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-black text-slate-900 dark:text-white block mb-1 text-lg tracking-tight" {...props} />,
                                    p: ({ node, ...props }) => <span className="text-base text-slate-600 dark:text-slate-400 block" {...props} />
                                }}
                            >
                                {summary.summary_md}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SittingSummaryCard;
