import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Grid3X3, TrendingUp, Filter, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import TermSwitcher from '../components/TermSwitcher';

interface Category {
    id: number;
    parent_id: number | null;
    slug: string;
    name_pl: string;
    name_citizen: string;
    level: number;
    color: string;
    vote_count: number;
    children?: Category[];
}

// Color classes for bars
const BAR_COLORS: Record<string, string> = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    red: 'bg-gradient-to-r from-red-500 to-red-600',
    slate: 'bg-gradient-to-r from-slate-500 to-slate-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    gray: 'bg-gradient-to-r from-gray-500 to-gray-600',
};

export default function Categories() {
    const [searchParams] = useSearchParams();
    const termParam = parseInt(searchParams.get('term') || '10');

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVotes, setTotalVotes] = useState(0);
    const [classifiedVotes, setClassifiedVotes] = useState(0);
    const [view, setView] = useState<'chart' | 'grid'>('chart');

    useEffect(() => {
        fetchData();
    }, [termParam]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch categories
            const { data: cats, error: catError } = await supabase
                .from('categories')
                .select('*')
                .order('level')
                .order('display_order');

            if (catError) throw catError;

            // Fetch vote counts
            const { data: countData } = await supabase.rpc('get_category_vote_counts', {
                term_id: termParam
            });

            // Get total votes
            const { count: totalCount } = await supabase
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('term', termParam);

            // Get classified votes
            const { data: classifiedData } = await supabase
                .from('vote_categories')
                .select('vote_id', { count: 'exact' })
                .limit(1);

            // Build hierarchy with counts
            const countMap = new Map<number, number>();
            let classifiedSum = 0;
            if (countData) {
                countData.forEach((c: { category_id: number; vote_count: number }) => {
                    countMap.set(c.category_id, c.vote_count);
                    classifiedSum += c.vote_count;
                });
            }

            const domains = (cats?.filter(c => c.level === 1) || []).map(d => ({
                ...d,
                vote_count: countMap.get(d.id) || 0,
                children: (cats?.filter(c => c.level === 2 && c.parent_id === d.id) || [])
                    .map(a => ({
                        ...a,
                        vote_count: countMap.get(a.id) || 0
                    }))
                    .sort((a, b) => b.vote_count - a.vote_count)
            })).sort((a, b) => b.vote_count - a.vote_count);

            setCategories(domains);
            setTotalVotes(totalCount || 0);

            // Get unique classified votes
            const { count: uniqueClassified } = await supabase
                .from('vote_categories')
                .select('vote_id', { count: 'exact', head: true });
            setClassifiedVotes(uniqueClassified || 0);

        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const maxVotes = Math.max(...categories.map(c => c.vote_count), 1);
    const coveragePercent = totalVotes > 0 ? Math.round((classifiedVotes / totalVotes) * 100) : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl w-1/3" />
                        <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-neutral-500 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft size={18} />
                            <span>Powrót</span>
                        </Link>
                        <TermSwitcher />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black text-neutral-900 dark:text-white">
                                Kategorie Głosowań
                            </h1>
                            <p className="text-neutral-500 mt-1">
                                Przeglądaj głosowania według tematyki
                            </p>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
                            <button
                                onClick={() => setView('chart')}
                                className={`p-2 rounded-md transition-colors ${view === 'chart'
                                    ? 'bg-white dark:bg-neutral-600 shadow-sm'
                                    : 'hover:bg-white/50'
                                    }`}
                            >
                                <BarChart3 size={18} />
                            </button>
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2 rounded-md transition-colors ${view === 'grid'
                                    ? 'bg-white dark:bg-neutral-600 shadow-sm'
                                    : 'hover:bg-white/50'
                                    }`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <BarChart3 className="text-blue-600" size={20} />
                            </div>
                            <span className="text-sm text-neutral-500">Wszystkie głosowania</span>
                        </div>
                        <p className="text-3xl font-black text-neutral-900 dark:text-white">
                            {totalVotes.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Filter className="text-green-600" size={20} />
                            </div>
                            <span className="text-sm text-neutral-500">Sklasyfikowane</span>
                        </div>
                        <p className="text-3xl font-black text-neutral-900 dark:text-white">
                            {classifiedVotes.toLocaleString()}
                            <span className="text-lg font-normal text-neutral-400 ml-2">
                                ({coveragePercent}%)
                            </span>
                        </p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <TrendingUp className="text-purple-600" size={20} />
                            </div>
                            <span className="text-sm text-neutral-500">Kategorie</span>
                        </div>
                        <p className="text-3xl font-black text-neutral-900 dark:text-white">
                            {categories.length}
                            <span className="text-lg font-normal text-neutral-400 ml-2">
                                domen
                            </span>
                        </p>
                    </div>
                </div>

                {/* Chart View */}
                {view === 'chart' && (
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6">
                            Rozkład głosowań według kategorii
                        </h2>

                        <div className="space-y-6">
                            {categories.map(domain => (
                                <div key={domain.id} className="space-y-3">
                                    {/* Domain bar */}
                                    <Link
                                        to={`/glosowania?category=${domain.slug}&term=${termParam}`}
                                        className="group block"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 transition-colors">
                                                {domain.name_citizen || domain.name_pl}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-neutral-500">
                                                    {domain.vote_count.toLocaleString()}
                                                </span>
                                                <ChevronRight size={16} className="text-neutral-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="h-8 bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden">
                                            <div
                                                className={`h-full ${BAR_COLORS[domain.color] || BAR_COLORS.gray} rounded-lg transition-all duration-500`}
                                                style={{ width: `${Math.max((domain.vote_count / maxVotes) * 100, 2)}%` }}
                                            />
                                        </div>
                                    </Link>

                                    {/* Subcategories */}
                                    {domain.children && domain.children.length > 0 && (
                                        <div className="ml-6 space-y-2">
                                            {domain.children.slice(0, 5).map(area => (
                                                <Link
                                                    key={area.id}
                                                    to={`/glosowania?category=${area.slug}&term=${termParam}`}
                                                    className="group flex items-center gap-3"
                                                >
                                                    <div className="w-32 text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-blue-600 truncate">
                                                        {area.name_citizen || area.name_pl}
                                                    </div>
                                                    <div className="flex-1 h-4 bg-neutral-100 dark:bg-neutral-700 rounded overflow-hidden">
                                                        <div
                                                            className={`h-full ${BAR_COLORS[area.color || domain.color] || BAR_COLORS.gray} opacity-70 rounded transition-all duration-500`}
                                                            style={{ width: `${Math.max((area.vote_count / maxVotes) * 100, 1)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-neutral-500 w-16 text-right">
                                                        {area.vote_count.toLocaleString()}
                                                    </span>
                                                </Link>
                                            ))}
                                            {domain.children.length > 5 && (
                                                <p className="text-xs text-neutral-400 ml-32">
                                                    +{domain.children.length - 5} więcej podkategorii
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {view === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(domain => (
                            <Link
                                key={domain.id}
                                to={`/glosowania?category=${domain.slug}&term=${termParam}`}
                                className="group bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                        {domain.name_citizen || domain.name_pl}
                                    </h3>
                                    <ChevronRight className="text-neutral-400 group-hover:text-blue-600 transition-colors" size={20} />
                                </div>

                                <p className="text-3xl font-black text-neutral-900 dark:text-white mb-4">
                                    {domain.vote_count.toLocaleString()}
                                    <span className="text-sm font-normal text-neutral-400 ml-2">głosowań</span>
                                </p>

                                {/* Mini bar chart for subcategories */}
                                <div className="space-y-2">
                                    {domain.children?.slice(0, 3).map(area => (
                                        <div key={area.id} className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-700 rounded overflow-hidden">
                                                <div
                                                    className={`h-full ${BAR_COLORS[domain.color] || BAR_COLORS.gray} opacity-60 rounded`}
                                                    style={{ width: `${Math.max((area.vote_count / (domain.vote_count || 1)) * 100, 5)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-neutral-500 w-20 truncate">
                                                {area.name_pl}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
