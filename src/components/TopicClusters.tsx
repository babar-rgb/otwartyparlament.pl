import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart, TrendingUp, Wheat, GraduationCap, Shield, Scale,
    Zap, Users, Globe, Palette, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CategorySummary {
    ux_category: string;
    total_votes: number;
    votes_this_month: number;
    avg_importance: number;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Heart; color: string; route: string }> = {
    '🏥 Zdrowie i NFZ': { icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200', route: '/glosowania?category=ZDROWIE' },
    '💰 Podatki i Ekonomia': { icon: TrendingUp, color: 'text-amber-500 bg-amber-50 border-amber-200', route: '/glosowania?category=GOSPODARKA' },
    '🚜 Rolnictwo i Środowisko': { icon: Wheat, color: 'text-green-600 bg-green-50 border-green-200', route: '/glosowania?category=ROLNICTWO' },
    '🎓 Edukacja i Nauka': { icon: GraduationCap, color: 'text-blue-500 bg-blue-50 border-blue-200', route: '/glosowania?category=EDUKACJA' },
    '🛡️ Bezpieczeństwo': { icon: Shield, color: 'text-slate-600 bg-slate-100 border-slate-200', route: '/glosowania?category=OBRONNOŚĆ' },
    '⚖️ Prawo i Sprawiedliwość': { icon: Scale, color: 'text-purple-500 bg-purple-50 border-purple-200', route: '/glosowania?category=SPRAWIEDLIWOŚĆ' },
    '⚡ Energia i Klimat': { icon: Zap, color: 'text-yellow-500 bg-yellow-50 border-yellow-200', route: '/glosowania?category=ENERGETYKA' },
    '🏠 Społeczeństwo': { icon: Users, color: 'text-indigo-500 bg-indigo-50 border-indigo-200', route: '/glosowania?category=POLITYKA%20SPOŁECZNA' },
    '🌍 Sprawy Zagraniczne': { icon: Globe, color: 'text-cyan-500 bg-cyan-50 border-cyan-200', route: '/glosowania?category=SPRAWY%20ZAGRANICZNE' },
    '🎭 Kultura': { icon: Palette, color: 'text-pink-500 bg-pink-50 border-pink-200', route: '/glosowania?category=KULTURA' },
};

export default function TopicClusters() {
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    async function fetchCategories() {
        try {
            const { data, error } = await supabase
                .from('view_ux_categories_summary')
                .select('*')
                .limit(10);

            if (error) throw error;

            // Filter out procedural and "other" categories for cleaner UX
            const filtered = (data || []).filter(cat =>
                !cat.ux_category?.includes('Procedury') &&
                !cat.ux_category?.includes('Inne')
            );

            setCategories(filtered);
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-ink mb-3">
                    Znajdź Tematy Dla Siebie
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Rolnik? Pacjent? Przedsiębiorca? Kliknij w kategorię, która Cię dotyczy.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.map((cat) => {
                    const config = CATEGORY_CONFIG[cat.ux_category] || {
                        icon: TrendingUp,
                        color: 'text-slate-500 bg-slate-50 border-slate-200',
                        route: '/glosowania'
                    };
                    const Icon = config.icon;
                    const categoryEmoji = cat.ux_category?.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '📋';

                    return (
                        <Link
                            key={cat.ux_category}
                            to={config.route}
                            className="group"
                        >
                            <div className={`border rounded-xl p-5 ${config.color} hover:scale-105 hover:shadow-lg transition-all duration-300 h-full`}>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-3xl">{categoryEmoji}</span>
                                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition" />
                                </div>

                                <h3 className="font-bold text-ink text-sm mb-1 line-clamp-2">
                                    {cat.ux_category?.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim()}
                                </h3>

                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-2xl font-bold">{cat.total_votes}</span>
                                    <span className="text-xs text-slate-500">głosowań</span>
                                </div>

                                {cat.votes_this_month > 0 && (
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-white/50 rounded text-xs text-slate-600">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        +{cat.votes_this_month} w tym miesiącu
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
