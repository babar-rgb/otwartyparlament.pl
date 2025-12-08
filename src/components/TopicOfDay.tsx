import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ControversyBar from './ControversyBar';

interface TopVote {
    id: number;
    term: number;
    sitting: number;
    voting_number: number;
    title_clean: string;
    date: string;
    verdict: string;
    importance_score: number;
    controversy_score: number;
    ux_category: string;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
    };
    ai_summary?: string;
}

export default function TopicOfDay() {
    const [topVote, setTopVote] = useState<TopVote | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopVote();
    }, []);

    async function fetchTopVote() {
        try {
            // Fallback: Get most important vote from last 7 days (or all time if none)
            const { data, error } = await supabase
                .from('votes')
                .select(`
          id, term, sitting, voting_number, title_clean, date, verdict, importance_score, controversy_score, 
          ux_category, details_json
        `)
                .not('importance_score', 'is', null)
                .order('importance_score', { ascending: false })
                .order('date', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;

            // Fetch AI summary if available
            if (data) {
                const { data: analysisData } = await supabase
                    .from('vote_analyses')
                    .select('summary')
                    .eq('vote_id', data.id)
                    .single();

                setTopVote({
                    ...data,
                    ai_summary: analysisData?.summary
                });
            }
        } catch (err) {
            console.error('Error fetching topic of day:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl h-80" />
        );
    }

    if (!topVote) return null;

    const yesVotes = topVote.details_json?.yes || 0;
    const noVotes = topVote.details_json?.no || 0;
    const totalVotes = yesVotes + noVotes;
    const yesPercent = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 50;

    return (
        <Link to={`/glosowania/${topVote.term}/${topVote.sitting}/${topVote.voting_number}`} className="block group">
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-red-950/30 rounded-3xl p-8 md:p-12 border border-amber-200 dark:border-amber-800/50 shadow-lg hover:shadow-2xl transition-all duration-500">

                {/* Background Decoration */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-red-200/20 to-amber-200/20 rounded-full blur-2xl" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Badge */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-lg">
                            <Flame className="w-5 h-5" />
                            <span className="font-bold text-sm uppercase tracking-wider">Temat Dnia</span>
                        </div>
                        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                            {new Date(topVote.date).toLocaleDateString('pl-PL', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                        {topVote.title_clean}
                    </h2>

                    {/* AI Summary */}
                    {topVote.ai_summary && (
                        <div className="flex items-start gap-3 mb-8 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-xl border border-amber-100 dark:border-amber-800/30">
                            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">
                                {topVote.ai_summary}
                            </p>
                        </div>
                    )}

                    {/* Vote Result Bar */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                ZA: {yesVotes}
                            </span>
                            <span className={`px-4 py-1 rounded-full font-bold text-sm ${topVote.verdict === 'PRZYJĘTO'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                }`}>
                                {topVote.verdict}
                            </span>
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">
                                PRZECIW: {noVotes}
                            </span>
                        </div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex shadow-inner">
                            <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                                style={{ width: `${yesPercent}%` }}
                            />
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-red-400"
                                style={{ width: `${100 - yesPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Controversy Bar */}
                    <ControversyBar score={topVote.controversy_score || 0} />

                    {/* CTA */}
                    <div className="flex items-center justify-between mt-8">
                        <div className="flex items-center gap-2">
                            {topVote.ux_category && (
                                <span className="px-3 py-1 bg-white/80 dark:bg-slate-800/80 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {topVote.ux_category}
                                </span>
                            )}
                            {topVote.importance_score && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/50 rounded-full text-sm font-bold text-violet-700 dark:text-violet-300">
                                    <TrendingUp className="w-3 h-3" />
                                    {topVote.importance_score}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold group-hover:gap-4 transition-all">
                            <span>Zobacz szczegóły</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
