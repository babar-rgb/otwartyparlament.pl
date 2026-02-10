import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart, TrendingUp, Wheat, GraduationCap, Shield, Scale,
    Zap, Users, Globe, Palette, ChevronRight
} from 'lucide-react';
import { fetchCategories, fetchCategoryVoteCounts } from '../../../api';

interface CategorySummary {
    ux_category: string;
    total_votes: number;
    votes_this_month: number;
    avg_importance: number;
    slug: string;
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string }> = {
    'ZDROWIE': { icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    'GOSPODARKA': { icon: TrendingUp, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    'ROLNICTWO': { icon: Wheat, color: 'text-green-600 bg-green-50 border-green-200' },
    'EDUKACJA': { icon: GraduationCap, color: 'text-blue-500 bg-blue-50 border-blue-200' },
    'OBRONNOŚĆ': { icon: Shield, color: 'text-slate-600 bg-slate-100 border-slate-200' },
    'SPRAWIEDLIWOŚĆ': { icon: Scale, color: 'text-purple-500 bg-purple-50 border-purple-200' },
    'ENERGETYKA': { icon: Zap, color: 'text-yellow-500 bg-yellow-50 border-yellow-200' },
    'POLITYKA SPOŁECZNA': { icon: Users, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    'SPRAWY ZAGRANICZNE': { icon: Globe, color: 'text-cyan-500 bg-cyan-50 border-cyan-200' },
    'KULTURA': { icon: Palette, color: 'text-pink-500 bg-pink-50 border-pink-200' },
};

export default function TopicClusters() {
    const [categories, setCategories] = useState<CategorySummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const cats = await fetchCategories();
                const counts = await fetchCategoryVoteCounts(10); // Term 10

                const countMap = new Map<number, number>();
                counts.forEach((c: any) => countMap.set(c.category_id, c.vote_count));

                const filtered = cats
                    .filter((c: any) => c.level === 1)
                    .map((c: any) => ({
                        ux_category: c.name_citizen || c.name_pl,
                        total_votes: countMap.get(c.id) || 0,
                        votes_this_month: 0, // Placeholder
                        avg_importance: 0,
                        slug: c.slug,
                        id: c.id
                    }))
                    .filter((c: any) => c.total_votes > 0)
                    .slice(0, 10);

                setCategories(filtered);
            } catch (err) {
                console.error('Error fetching categories:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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
                <h2 className="text-3xl md:text-4xl font-extrabold text-ink mb-3">Znajdź Tematy Dla Siebie</h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">Rolnik? Pacjent? Przedsiębiorca? Kliknij w kategorię, która Cię dotyczy.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categories.map((cat) => {
                    const config = CATEGORY_CONFIG[cat.ux_category.toUpperCase()] || {
                        icon: TrendingUp,
                        color: 'text-slate-500 bg-slate-50 border-slate-200'
                    };
                    const Icon = config.icon;

                    return (
                        <Link key={cat.slug} to={`/categories/${cat.slug}`} className="group">
                            <div className={`border rounded-xl p-5 ${config.color} hover:scale-105 hover:shadow-lg transition-all duration-300 h-full`}>
                                <div className="flex items-center justify-between mb-3">
                                    <Icon className="w-8 h-8" />
                                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition" />
                                </div>
                                <h3 className="font-bold text-ink text-sm mb-1 line-clamp-2">{cat.ux_category}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-2xl font-bold">{cat.total_votes}</span>
                                    <span className="text-xs text-slate-500">głosowań</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
