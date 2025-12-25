import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';
import { db } from '../lib/db';

interface Highlight {
    id: number;
    title: string;
    date: string;
    verdict: string;
    ux_category: string;
    importance_score: number;
    controversy_score: number;
    ai_summary: string;
    votes_yes: string;
    votes_no: string;
}

export default function WeeklyHighlights() {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

    useEffect(() => {
        fetchHighlights();
    }, [timeRange]);

    async function fetchHighlights() {
        setLoading(true);
        try {
            const viewName = timeRange === 'week' ? 'view_highlights_week' : 'view_highlights_month';
            const { data, error } = await db
                .from(viewName)
                .select('*')
                .limit(5);

            if (error) throw error;
            setHighlights(data || []);
        } catch (err) {
            console.error('Error fetching highlights:', err);
            setHighlights([]);
        } finally {
            setLoading(false);
        }
    }

    const getVerdictStyle = (verdict: string) => {
        if (verdict === 'PRZYJĘTO') {
            return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
        return 'bg-red-100 text-red-700 border-red-200';
    };

    const getCategoryEmoji = (category: string) => {
        if (!category) return '📋';
        const emoji = category.match(/[\u{1F300}-\u{1F9FF}]/u);
        return emoji ? emoji[0] : '📋';
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-xl" />
                ))}
            </div>
        );
    }

    if (highlights.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Brak ważnych głosowań w tym okresie</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header with time toggle */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-xl">
                        <Flame className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-ink">
                            Wydarzenia {timeRange === 'week' ? 'Tygodnia' : 'Miesiąca'}
                        </h2>
                        <p className="text-slate-500">Najważniejsze głosowania</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                        onClick={() => setTimeRange('week')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${timeRange === 'week'
                                ? 'bg-white shadow text-ink'
                                : 'text-slate-500 hover:text-ink'
                            }`}
                    >
                        Tydzień
                    </button>
                    <button
                        onClick={() => setTimeRange('month')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${timeRange === 'month'
                                ? 'bg-white shadow text-ink'
                                : 'text-slate-500 hover:text-ink'
                            }`}
                    >
                        Miesiąc
                    </button>
                </div>
            </div>

            {/* Highlights List */}
            <div className="space-y-4">
                {highlights.map((highlight, index) => (
                    <Link
                        key={highlight.id}
                        to={`/glosowanie/${highlight.id}`}
                        className="block group"
                    >
                        <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Number & Category */}
                                <div className="flex-shrink-0 flex items-start gap-4">
                                    <span className="text-3xl font-light text-slate-300 group-hover:text-amber-500 transition">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="text-2xl" title={highlight.ux_category}>
                                        {getCategoryEmoji(highlight.ux_category)}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-grow min-w-0">
                                    <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-amber-600 transition line-clamp-2">
                                        {highlight.title}
                                    </h3>

                                    {highlight.ai_summary && highlight.ai_summary !== 'Brak analizy' && (
                                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                                            {highlight.ai_summary}
                                        </p>
                                    )}

                                    {/* Meta badges */}
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                                            <TrendingUp className="w-3 h-3" />
                                            Ważność: {highlight.importance_score}
                                        </span>

                                        {highlight.controversy_score >= 70 && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
                                                <AlertTriangle className="w-3 h-3" />
                                                Kontrowersyjne
                                            </span>
                                        )}

                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                                            {new Date(highlight.date).toLocaleDateString('pl-PL')}
                                        </span>
                                    </div>
                                </div>

                                {/* Vote Result */}
                                <div className="flex-shrink-0 w-full md:w-48">
                                    <div className={`text-center py-2 rounded-full font-bold text-sm border ${getVerdictStyle(highlight.verdict)}`}>
                                        {highlight.verdict}
                                    </div>

                                    {highlight.votes_yes && highlight.votes_no && (
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                <span>Za: {highlight.votes_yes}</span>
                                                <span>Przeciw: {highlight.votes_no}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{
                                                        width: `${(parseInt(highlight.votes_yes) / (parseInt(highlight.votes_yes) + parseInt(highlight.votes_no))) * 100}%`
                                                    }}
                                                />
                                                <div
                                                    className="h-full bg-red-500"
                                                    style={{
                                                        width: `${(parseInt(highlight.votes_no) / (parseInt(highlight.votes_yes) + parseInt(highlight.votes_no))) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* View All Link */}
            <div className="mt-6 text-center">
                <Link
                    to="/glosowania?sort=importance"
                    className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                >
                    Zobacz wszystkie ważne głosowania
                    <span>→</span>
                </Link>
            </div>
        </div>
    );
}
