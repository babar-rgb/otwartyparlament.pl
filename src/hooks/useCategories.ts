import { useQuery } from '@tanstack/react-query';
import { fetchCategories, fetchCategoryVoteCounts, fetchVotes } from '../api';

export interface Category {
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

export function useCategories(term: number) {
    return useQuery({
        queryKey: ['categories', term],
        queryFn: async () => {
            // Fetch categories, vote counts per category, and total votes
            const [cats, countData, votesRes] = await Promise.all([
                fetchCategories(),
                fetchCategoryVoteCounts(term),
                fetchVotes({ term, limit: 1 })
            ]);

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

            return {
                categories: domains,
                totalVotes: votesRes?.total || 0,
                classifiedVotes: votesRes?.total || 0 // Placeholder logic as in original
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
