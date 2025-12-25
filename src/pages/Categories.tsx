import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Grid3X3, TrendingUp, Filter, ChevronRight } from 'lucide-react';
import { db } from '../lib/db';
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
    blue: 'bg-gradient-to-r from-blue-500 to-blue-400',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    red: 'bg-gradient-to-r from-red-500 to-red-400',
    slate: 'bg-gradient-to-r from-slate-500 to-slate-400',
    emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
    orange: 'bg-gradient-to-r from-orange-500 to-orange-400',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
    gray: 'bg-gradient-to-r from-slate-500 to-slate-400',
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
            const { data: cats, error: catError } = await db
                .from('categories')
                .select('*')
                .order('level')
                .order('display_order');

            if (catError) throw catError;

            // Fetch vote counts
            const { data: countData } = await db.rpc('get_category_vote_counts', {
                term_id: termParam
            });

            // Get total votes
            const { count: totalCount } = await db
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('term', termParam);

            // Get classified votes
            const { data: classifiedData } = await db
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
            const { count: uniqueClassified } = await db
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
            <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
                <div className="text-white/40 text-sm font-medium tracking-wider uppercase">Ładowanie kategorii...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06060c] pt-24 pb-16">
            {/* Header */}
            <div className="border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-white/40 hover:text-blue-400 transition-colors text-sm"
                        >
                            <ArrowLeft size={16} />
                            <span>Powrót</span>
                        </Link>
                        <TermSwitcher />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                                Kategorie Głosowań
                            </h1>
                            <p className="text-white/50 text-lg">
                                Przeglądaj głosowania według tematyki
                            </p>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                            <button
                                onClick={() => setView('chart')}
                                className={`p-2.5 rounded-lg transition-colors ${view === 'chart'
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                <BarChart3 size={18} />
                            </button>
                            <button
                                onClick={() => setView('grid')}
                                className={`p-2.5 rounded-lg transition-colors ${view === 'grid'
                                    ? 'bg-white/10 text-white'
                                    : 'text-white/40 hover:text-white/60'
                                    }`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <div className="bg-[#111126] rounded-2xl p-6 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <BarChart3 className="text-blue-400" size={20} />
                            </div>
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Wszystkie głosowania</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {totalVotes.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-[#111126] rounded-2xl p-6 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <Filter className="text-emerald-400" size={20} />
                            </div>
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Sklasyfikowane</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {classifiedVotes.toLocaleString()}
                            <span className="text-base font-normal text-white/40 ml-2">
                                ({coveragePercent}%)
                            </span>
                        </p>
                    </div>

                    <div className="bg-[#111126] rounded-2xl p-6 border border-white/5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <TrendingUp className="text-purple-400" size={20} />
                            </div>
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Kategorie</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {categories.length}
                            <span className="text-base font-normal text-white/40 ml-2">
                                domen
                            </span>
                        </p>
                    </div>
                </div>

                {/* Chart View */}
                {view === 'chart' && (
                    <div className="bg-[#111126] rounded-2xl border border-white/5 p-6">
                        <h2 className="text-xl font-bold text-white mb-8">
                            Rozkład głosowań według kategorii
                        </h2>

                        <div className="space-y-8">
                            {categories.map(domain => (
                                <div key={domain.id} className="space-y-3">
                                    {/* Domain bar */}
                                    <Link
                                        to={`/glosowania?category=${domain.slug}&term=${termParam}`}
                                        className="group block"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                {domain.name_citizen || domain.name_pl}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-white/40">
                                                    {domain.vote_count.toLocaleString()}
                                                </span>
                                                <ChevronRight size={16} className="text-white/30 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
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
                                                    <div className="w-32 text-sm text-white/40 group-hover:text-blue-400 truncate">
                                                        {area.name_citizen || area.name_pl}
                                                    </div>
                                                    <div className="flex-1 h-4 bg-white/5 rounded overflow-hidden">
                                                        <div
                                                            className={`h-full ${BAR_COLORS[area.color || domain.color] || BAR_COLORS.gray} opacity-70 rounded transition-all duration-500`}
                                                            style={{ width: `${Math.max((area.vote_count / maxVotes) * 100, 1)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-white/30 w-16 text-right">
                                                        {area.vote_count.toLocaleString()}
                                                    </span>
                                                </Link>
                                            ))}
                                            {domain.children.length > 5 && (
                                                <p className="text-xs text-white/20 ml-32">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {categories.map(domain => (
                            <Link
                                key={domain.id}
                                to={`/glosowania?category=${domain.slug}&term=${termParam}`}
                                className="group bg-[#111126] rounded-2xl border border-white/5 p-6 hover:border-white/20 hover:bg-[#16162d] transition-all"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                        {domain.name_citizen || domain.name_pl}
                                    </h3>
                                    <ChevronRight className="text-white/30 group-hover:text-blue-400 transition-colors" size={20} />
                                </div>

                                <p className="text-3xl font-bold text-white mb-4">
                                    {domain.vote_count.toLocaleString()}
                                    <span className="text-sm font-normal text-white/40 ml-2">głosowań</span>
                                </p>

                                {/* Mini bar chart for subcategories */}
                                <div className="space-y-2">
                                    {domain.children?.slice(0, 3).map(area => (
                                        <div key={area.id} className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-white/5 rounded overflow-hidden">
                                                <div
                                                    className={`h-full ${BAR_COLORS[domain.color] || BAR_COLORS.gray} opacity-60 rounded`}
                                                    style={{ width: `${Math.max((area.vote_count / (domain.vote_count || 1)) * 100, 5)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-white/30 w-20 truncate">
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
