import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchEuroVotes } from '../api';

export function useEuroVotesList(options: {
    term: number;
    tag?: string;
    keyOnly?: boolean;
    search?: string;
    limit: number;
}) {
    const { term, tag, keyOnly, search, limit } = options;

    return useInfiniteQuery({
        queryKey: ['euroVotesList', term, tag, keyOnly, search],
        queryFn: async ({ pageParam = 0 }) => {
            return await fetchEuroVotes({
                term,
                tag: tag === 'Wszystkie' ? undefined : tag,
                keyOnly,
                search,
                skip: pageParam * limit,
                limit
            });
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === limit ? allPages.length : undefined;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
