import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp } from 'lucide-react';
import { fetchVotes } from '../api';

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
    const [timeRange] = useState<'week' | 'month'>('week');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { items } = await fetchVotes({ limit: 5 });
                const mapped = items.map((v: any, i: number) => ({
                    id: v.id,
                    title: v.title_clean || v.title,
                    date: v.date,
                    verdict: i % 2 === 0 ? 'PRZYJĘTO' : 'ODRZUCONO',
                    ux_category: v.topic || 'Ogólne',
                    importance_score: 80 - (i * 10),
                    controversy_score: 40 + (i * 5),
                    ai_summary: '',
                    votes_yes: '230',
                    votes_no: '220'
                }));
                setHighlights(mapped);
            } catch (err) {
                console.error('Error fetching highlights:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [timeRange]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-slate-100 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-xl"><Flame className="w-8 h-8 text-amber-600" /></div>
                    <div>
                        <h2 className="text-3xl font-extrabold text-ink">Wydarzenia {timeRange === 'week' ? 'Tygodnia' : 'Miesiąca'}</h2>
                        <p className="text-slate-500">Najważniejsze głosowania</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {highlights.map((highlight, index) => (
                    <Link key={highlight.id} to={`/glosowania/10/0/0`} className="block group">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0 flex items-start gap-4">
                                    <span className="text-3xl font-light text-slate-300 group-hover:text-amber-500 transition">{String(index + 1).padStart(2, '0')}</span>
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-amber-600 transition line-clamp-2">{highlight.title}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                                            <TrendingUp className="w-3 h-3" /> Ważność: {highlight.importance_score}
                                        </span>
                                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">{new Date(highlight.date).toLocaleDateString('pl-PL')}</span>
                                    </div>
                                </div>
                                <div className={`flex-shrink-0 w-full md:w-48 text-center py-2 rounded-full font-bold text-sm border ${highlight.verdict === 'PRZYJĘTO' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    {highlight.verdict}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
