
import React, { useEffect, useState } from 'react';
import { Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useTerm } from '../context/TermContext';
import { API_URL } from '../api';

interface SittingSummary {
    term: number;
    sitting_number: number;
    summary_md: string;
    updated_at: string;
    top_votes?: {
        id: number;
        title: string;
        verdict: string;
    }[];
}

const SittingSummaryCard: React.FC = () => {
    const { term } = useTerm();
    const [summary, setSummary] = useState<SittingSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            // Reset state when term changes
            setLoading(true);
            setSummary(null);

            try {
                console.log("Fetching sitting summary from:", `${API_URL}/api/sittings/latest/summary?term=${term}`);
                const response = await fetch(`${API_URL}/api/sittings/latest/summary?term=${term}`);
                if (!response.ok) {
                    console.error("Fetch failed with status:", response.status);
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
        <Link to="/posiedzenia/historia" className="relative group/card h-full block">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-purple-600/10 rounded-[2.5rem] blur-2xl opacity-20 group-hover/card:opacity-40 transition-opacity duration-700" />

            <div className="relative h-full bg-[#FFFAF0] dark:bg-[#1a1625] rounded-[2.5rem] border border-amber-900/10 dark:border-purple-500/20 shadow-xl overflow-hidden flex flex-col group-hover/card:bg-amber-500/5 dark:group-hover/card:bg-purple-500/5 transition-colors">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />

                <div className="p-6 md:p-8 flex flex-col gap-6 relative z-10 h-full">
                    {/* Header Row */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-900/5 dark:bg-amber-500/10 text-amber-900 dark:text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-900/10 group-hover/card:border-amber-500/30 transition-colors">
                                <Sparkles size={12} className="animate-pulse" />
                                <span>Raport Tygodnia</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover/card:text-amber-500/50 transition-colors">
                                <Calendar size={12} />
                                <span>Nr {summary.sitting_number}</span>
                            </div>
                        </div>

                        <div className="block">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight mb-1 tracking-tight group-hover/card:text-amber-600 dark:group-hover/card:text-amber-500 transition-colors">
                                Raport z Sejmu
                            </h2>
                            <p className="text-amber-700 dark:text-amber-400 font-serif italic text-sm opacity-80 flex items-center gap-1">
                                Kluczowe decyzje i uchwały
                                <ChevronRight size={14} className="opacity-0 -translate-x-2 group-hover/card:opacity-100 group-hover/card:translate-x-0 transition-all" />
                            </p>
                        </div>
                    </div>

                    {/* Content Section - Compact */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:marker:text-amber-500">
                            <ReactMarkdown
                                components={{
                                    ul: ({ node, ...props }) => <ul className="space-y-3 list-none pl-0 block" {...props} />,
                                    li: ({ node, ...props }) => (
                                        <li className="relative pl-5 mb-3" {...props}>
                                            <span className="absolute left-0 top-2.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            <span className="text-slate-700 dark:text-slate-300 block leading-relaxed text-sm">{props.children}</span>
                                        </li>
                                    ),
                                    strong: ({ node, ...props }) => <strong className="font-black text-slate-900 dark:text-white block mb-0.5 text-base tracking-tight" {...props} />,
                                    p: ({ node, ...props }) => <span className="text-sm text-slate-600 dark:text-slate-400 block" {...props} />
                                }}
                            >
                                {summary.summary_md}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Key Votes Section */}
                    {summary.top_votes && summary.top_votes.length > 0 && (
                        <div className="mt-0 pt-0 space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Kluczowe Głosowania
                            </h4>
                            <div className="space-y-2">
                                {summary.top_votes.map(vote => (
                                    <Link
                                        key={vote.id}
                                        to={`/glosowanie/${vote.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-white/5 border border-amber-900/5 dark:border-white/5 transition-all group/vote"
                                    >
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px] md:max-w-[220px]">
                                            {cleanTitle(vote.title)}
                                        </span>
                                        <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${['Uchwalono', 'PRZYJĘTO'].includes(vote.verdict)
                                            ? 'bg-emerald-500/10 text-emerald-600'
                                            : ['Odrzucono', 'ODRZUCONO'].includes(vote.verdict)
                                                ? 'bg-rose-500/10 text-rose-600'
                                                : 'bg-amber-500/10 text-amber-600'
                                            }`}>
                                            {['Uchwalono', 'PRZYJĘTO'].includes(vote.verdict) ? 'ZA' : ['Odrzucono', 'ODRZUCONO'].includes(vote.verdict) ? 'PRZECIW' : '?'}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-4 mt-auto border-t border-amber-900/5 dark:border-white/5">
                        <div className="text-[10px] font-black uppercase tracking-widest flex items-center justify-between text-slate-900 dark:text-white group-hover/card:text-amber-600 dark:group-hover/card:text-amber-500 transition-colors">
                            <span>Zobacz pełną historię</span>
                            <ChevronRight size={14} className="group-hover/card:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const cleanTitle = (title: string) => {
    return title
        .replace(/^\d+[\.\s]+/, '') // Remove leading numbers
        .replace(/\(druki? nr.*?\)/gi, '') // Remove (druki nr...)
        .replace(/ – .*$/, '') // Optional: remove very long suffixes after dash if needed
        .trim();
};

export default SittingSummaryCard;
