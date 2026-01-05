import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, Grid3X3, TrendingUp, Filter, ChevronRight, Sparkles } from 'lucide-react';
import { fetchCategories, fetchCategoryVoteCounts, fetchVotes } from '../api';
import TermSwitcher from '../components/ui/TermSwitcher';
import SEO from '../components/SEO';

interface Category {
    id: number;
    parent_id: number | null;
    slug: string;
    name_pl: string;
    name_citizen: string;
    level: number;
    color: string;
    ux_category?: string;
    vote_count: number;
    children?: Category[];
}

// Color classes for bars with premium gradients
const BAR_COLORS: Record<string, string> = {
    blue: 'bg-gradient-to-r from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20',
    green: 'bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20',
    red: 'bg-gradient-to-r from-rose-600 to-pink-500 shadow-lg shadow-rose-500/20',
    orange: 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg shadow-orange-500/20',
    purple: 'bg-gradient-to-r from-purple-600 to-violet-500 shadow-lg shadow-purple-500/20',
    gray: 'bg-gradient-to-r from-slate-600 to-slate-400 shadow-lg shadow-slate-500/20',
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
            const cats = await fetchCategories();

            // Fetch vote counts per category
            const countData = await fetchCategoryVoteCounts(termParam);

            // Get total votes
            const { total: totalCount } = await fetchVotes({
                term: termParam,
                limit: 1
            });

            // Get hierarchy
            const countMap = new Map<number, number>();
            if (countData) {
                countData.forEach((c: { category_id: number; vote_count: number }) => {
                    countMap.set(c.category_id, c.vote_count);
                });
            }

            const domains = (cats?.filter((c: Category) => c.level === 1) || []).map((d: Category) => ({
                ...d,
                vote_count: countMap.get(d.id) || 0,
                children: (cats?.filter((c: Category) => c.level === 2 && c.parent_id === d.id) || [])
                    .map((a: Category) => ({
                        ...a,
                        vote_count: countMap.get(a.id) || 0
                    }))
                    .sort((a: Category, b: Category) => b.vote_count - a.vote_count)
            })).sort((a: Category, b: Category) => b.vote_count - a.vote_count);

            setCategories(domains);
            setTotalVotes(totalCount || 0);

            // Fetch classified count - mocking for now as we don't have separate endpoint
            setClassifiedVotes(totalCount || 0);

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
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin"></div>
                    <div className="text-secondary text-xs font-black uppercase tracking-widest">Katalogowanie tematów...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page transition-colors duration-500 pb-24">
            <SEO
                title="Kategorie Głosowań"
                description="Przeglądaj aktywność Sejmu według dziedzin – od gospodarki po sprawy społeczne."
            />

            {/* Header Section */}
            <div className="pt-32 pb-16 px-4 md:px-8 border-b border-border-base relative overflow-hidden dashboard-mesh">
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 text-secondary hover:text-accent-blue transition-colors text-xs font-black uppercase tracking-[0.2em]"
                        >
                            <ArrowLeft size={14} />
                            Powrót do dashboardu
                        </Link>
                        <TermSwitcher />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full border border-purple-500/20 text-[10px] font-black uppercase tracking-widest mb-4">
                                <Sparkles size={12} />
                                Semantic Analysis Mode
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                                Kategorie <span className="italic font-serif opacity-60">Głosowań</span>
                            </h1>
                            <p className="text-secondary text-lg font-medium max-w-2xl leading-relaxed">
                                System automatycznej kategoryzacji analizuje tytulaturę i treść projektów ustaw, przypisując je do 40+ obszarów tematycznych.
                            </p>
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-2xl p-1.5 border border-border-base backdrop-blur-xl">
                            <button
                                onClick={() => setView('chart')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${view === 'chart'
                                    ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                                    : 'text-secondary hover:text-primary hover:bg-white/5'
                                    }`}
                            >
                                <BarChart3 size={16} />
                                Wykres
                            </button>
                            <button
                                onClick={() => setView('grid')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${view === 'grid'
                                    ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                                    : 'text-secondary hover:text-primary hover:bg-white/5'
                                    }`}
                            >
                                <Grid3X3 size={16} />
                                Siatka
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-8 relative z-20">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-surface rounded-3xl p-8 border border-border-base shadow-lg shadow-black/5 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <BarChart3 size={24} />
                            </div>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Total Records</span>
                        </div>
                        <p className="text-4xl font-black text-primary tracking-tight">
                            {totalVotes.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-surface rounded-3xl p-8 border border-border-base shadow-lg shadow-black/5 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <Filter size={24} />
                            </div>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Categorized</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-4xl font-black text-primary tracking-tight">
                                {classifiedVotes.toLocaleString()}
                            </p>
                            <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                {coveragePercent}%
                            </span>
                        </div>
                    </div>

                    <div className="bg-surface rounded-3xl p-8 border border-border-base shadow-lg shadow-black/5 group hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-transform">
                                <TrendingUp size={24} />
                            </div>
                            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Active Domains</span>
                        </div>
                        <p className="text-4xl font-black text-primary tracking-tight">
                            {categories.length}
                        </p>
                    </div>
                </div>

                {/* Chart View */}
                {view === 'chart' && (
                    <div className="bg-surface rounded-[2.5rem] border border-border-base p-10 shadow-xl">
                        <h2 className="text-xl font-black text-primary mb-12 tracking-tight flex items-center gap-4">
                            Wizualizacja Wolumenu Decyzji
                            <div className="h-px flex-1 bg-border-base"></div>
                        </h2>

                        <div className="space-y-12">
                            {categories.map(domain => (
                                <div key={domain.id} className="space-y-4">
                                    <Link
                                        to={`/glosowania?category_id=${domain.id}&term=${termParam}`}
                                        className="group block"
                                    >
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <span className="text-lg font-black text-primary group-hover:text-accent-blue transition-colors flex items-center gap-3">
                                                {domain.name_citizen || domain.name_pl}
                                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all translate-x--2 group-hover:translate-x-0" />
                                            </span>
                                            <div className="text-right">
                                                <span className="text-2xl font-mono font-black text-primary block leading-none">
                                                    {domain.vote_count.toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-secondary opacity-40">głosowań</span>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-border-base/50">
                                            <div
                                                className={`h-full ${BAR_COLORS[domain.ux_category || 'gray'] || BAR_COLORS.gray} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]`}
                                                style={{ width: `${Math.max((domain.vote_count / maxVotes) * 100, 1.5)}%` }}
                                            />
                                        </div>
                                    </Link>

                                    {/* Subcategories */}
                                    {domain.children && domain.children.length > 0 && (
                                        <div className="ml-8 space-y-4 border-l border-border-base pl-8 py-2">
                                            {domain.children.slice(0, 6).map(sub => (
                                                <Link
                                                    key={sub.id}
                                                    to={`/glosowania?category_id=${sub.id}&term=${termParam}`}
                                                    className="group/item flex items-center justify-between p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-border-base/50"
                                                >
                                                    <span className="text-secondary group-hover/item:text-primary transition-colors font-medium text-sm flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${sub.vote_count > 0 ? 'bg-accent-blue' : 'bg-border-base'}`}></div>
                                                        {sub.name_citizen}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black bg-surface px-2 py-1 rounded-md text-secondary border border-border-base">
                                                            {sub.vote_count}
                                                        </span>
                                                        <ChevronRight size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-accent-blue" />
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid View */}
                {view === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map(domain => (
                            <Link
                                key={domain.id}
                                to={`/glosowania?category_id=${domain.id}&term=${termParam}`}
                                className="group bg-surface rounded-[2.5rem] border border-border-base p-10 hover:border-accent-blue/30 shadow-lg shadow-black/[0.02] hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col"
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`p-4 rounded-2xl ${BAR_COLORS[domain.ux_category || 'gray'] || BAR_COLORS.gray} bg-opacity-10 text-primary group-hover:scale-110 transition-transform`}>
                                        <BarChart3 size={24} className="text-white" />
                                    </div>
                                    <ChevronRight className="text-secondary opacity-20 group-hover:opacity-100 group-hover:text-accent-blue group-hover:translate-x-1 transition-all" size={24} />
                                </div>

                                <h3 className="text-2xl font-black text-primary mb-2 tracking-tight group-hover:text-accent-blue transition-colors">
                                    {domain.name_citizen || domain.name_pl}
                                </h3>

                                <div className="flex items-baseline gap-2 mb-8">
                                    <span className="text-4xl font-mono font-black text-primary leading-none">{domain.vote_count.toLocaleString()}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary opacity-40">Records</span>
                                </div>

                                {/* Mini summary */}
                                <div className="mt-auto space-y-3 pt-6 border-t border-border-base">
                                    {domain.children?.slice(0, 3).map(area => (
                                        <div key={area.id} className="flex items-center gap-3">
                                            <div className="flex-1 h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${BAR_COLORS[domain.ux_category || 'gray'] || BAR_COLORS.gray} opacity-40 group-hover:opacity-100 rounded-full`}
                                                    style={{ width: `${Math.max((area.vote_count / (domain.vote_count || 1)) * 100, 10)}%` }}
                                                />
                                            </div>
                                            <span className="text-[9px] font-bold text-secondary/60 uppercase tracking-tighter truncate w-24">
                                                {area.name_pl}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-6 border-t border-border-base/50">
                                    <div className="flex items-center justify-between text-sm font-bold text-accent-blue">
                                        <span>Przeglądaj kategorię</span>
                                        <ArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" size={16} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
