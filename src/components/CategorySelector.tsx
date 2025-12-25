import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { db } from '../lib/db';

interface Category {
    id: number;
    parent_id: number | null;
    slug: string;
    name_pl: string;
    name_citizen: string;
    level: number;
    icon: string;
    color: string;
    vote_count?: number;
    children?: Category[];
}

interface CategorySelectorProps {
    selectedCategory: string | null;
    onCategoryChange: (slug: string | null) => void;
    termId?: number;
}

// Color mapping for categories
const COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
    green: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
    red: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200',
};

const SELECTED_COLOR_MAP: Record<string, string> = {
    blue: 'bg-blue-600 text-white border-blue-700',
    green: 'bg-green-600 text-white border-green-700',
    red: 'bg-red-600 text-white border-red-700',
    slate: 'bg-slate-600 text-white border-slate-700',
    emerald: 'bg-emerald-600 text-white border-emerald-700',
    orange: 'bg-orange-600 text-white border-orange-700',
    purple: 'bg-purple-600 text-white border-purple-700',
    gray: 'bg-gray-600 text-white border-gray-700',
};

export default function CategorySelector({
    selectedCategory,
    onCategoryChange,
    termId = 10
}: CategorySelectorProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedDomains, setExpandedDomains] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showMobile, setShowMobile] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, [termId]);

    const fetchCategories = async () => {
        try {
            // Fetch categories with vote counts
            const { data: cats, error: catError } = await db
                .from('categories')
                .select('*')
                .order('level')
                .order('display_order');

            if (catError) throw catError;

            // Fetch vote counts per category
            const { data: counts, error: countError } = await db
                .rpc('get_category_vote_counts', { term_id: termId });

            // Build hierarchy
            const countMap = new Map<number, number>();
            if (counts) {
                counts.forEach((c: { category_id: number; vote_count: number }) => {
                    countMap.set(c.category_id, c.vote_count);
                });
            }

            // Organize into tree structure
            const domains = cats?.filter(c => c.level === 1) || [];
            const areas = cats?.filter(c => c.level === 2) || [];

            const tree = domains.map(domain => ({
                ...domain,
                vote_count: countMap.get(domain.id) || 0,
                children: areas
                    .filter(a => a.parent_id === domain.id)
                    .map(a => ({
                        ...a,
                        vote_count: countMap.get(a.id) || 0
                    }))
                    .filter(a => (a.vote_count || 0) > 0) // Only show areas with votes
            })).filter(d => (d.children?.length || 0) > 0 || (d.vote_count || 0) > 0);

            setCategories(tree);
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleDomain = (domainId: number) => {
        setExpandedDomains(prev => {
            const next = new Set(prev);
            if (next.has(domainId)) {
                next.delete(domainId);
            } else {
                next.add(domainId);
            }
            return next;
        });
    };

    const handleSelect = (slug: string) => {
        if (selectedCategory === slug) {
            onCategoryChange(null);
        } else {
            onCategoryChange(slug);
        }
        setShowMobile(false);
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-xl h-12" />
        );
    }

    const selectedCat = categories.flatMap(d => [d, ...(d.children || [])]).find(c => c.slug === selectedCategory);

    return (
        <div className="relative">
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setShowMobile(!showMobile)}
                className="md:hidden w-full flex items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-neutral-500" />
                    <span className="font-medium">
                        {selectedCat ? selectedCat.name_citizen || selectedCat.name_pl : 'Filtruj kategorie'}
                    </span>
                </div>
                <ChevronDown size={18} className={`transition-transform ${showMobile ? 'rotate-180' : ''}`} />
            </button>

            {/* Category Panel */}
            <div className={`
                ${showMobile ? 'block' : 'hidden'} md:block
                absolute md:relative z-50 left-0 right-0 top-full mt-2 md:mt-0
                bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700
                shadow-lg md:shadow-none p-4
            `}>
                {/* Clear button */}
                {selectedCategory && (
                    <button
                        onClick={() => onCategoryChange(null)}
                        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-red-600 mb-3"
                    >
                        <X size={14} />
                        Wyczyść filtr
                    </button>
                )}

                {/* Domain list */}
                <div className="space-y-2">
                    {categories.map(domain => (
                        <div key={domain.id} className="border-b border-neutral-100 dark:border-neutral-700 pb-2 last:border-0">
                            {/* Domain header */}
                            <button
                                onClick={() => toggleDomain(domain.id)}
                                className={`
                                    w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg
                                    text-left font-semibold text-sm
                                    ${selectedCategory === domain.slug
                                        ? SELECTED_COLOR_MAP[domain.color] || SELECTED_COLOR_MAP.gray
                                        : `hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200`
                                    }
                                    transition-colors
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    {expandedDomains.has(domain.id)
                                        ? <ChevronDown size={16} />
                                        : <ChevronRight size={16} />
                                    }
                                    <span>{domain.name_citizen || domain.name_pl}</span>
                                </div>
                                <span className="text-xs opacity-60">{domain.vote_count}</span>
                            </button>

                            {/* Areas (children) */}
                            {expandedDomains.has(domain.id) && domain.children && (
                                <div className="ml-6 mt-1 space-y-1">
                                    {domain.children.map(area => (
                                        <button
                                            key={area.id}
                                            onClick={() => handleSelect(area.slug)}
                                            className={`
                                                w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg
                                                text-left text-sm border
                                                ${selectedCategory === area.slug
                                                    ? SELECTED_COLOR_MAP[area.color || domain.color] || SELECTED_COLOR_MAP.gray
                                                    : COLOR_MAP[area.color || domain.color] || COLOR_MAP.gray
                                                }
                                                transition-colors
                                            `}
                                        >
                                            <span>{area.name_citizen || area.name_pl}</span>
                                            <span className="text-xs opacity-60 font-medium">{area.vote_count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Quick stats */}
                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <p className="text-xs text-neutral-500">
                        {categories.reduce((sum, d) => sum + (d.vote_count || 0), 0).toLocaleString()} głosowań w {categories.length} kategoriach
                    </p>
                </div>
            </div>
        </div>
    );
}
