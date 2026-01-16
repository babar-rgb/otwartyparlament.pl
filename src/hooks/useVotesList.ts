import { useState, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchVotes as apiFetchVotes } from '../api';
import { useTerm } from '../context/TermContext';

export interface VoteItem {
    id: number;
    sitting?: number;
    voting_number?: number;
    date: string;
    title: string;
    topic?: string;
    kind?: string;
    title_clean?: string;
    term?: number;
    mpVote?: string;
    isFinal?: boolean;
    verdict?: string;
    for?: number;
    against?: number;
    abstained?: number;
}

const PAGE_SIZE = 100;

export function useVotesList(mpId?: string | null, rebellion?: boolean) {
    const { term } = useTerm();
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [verdict, setVerdict] = useState<string>('');

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading,
        error
    } = useInfiniteQuery({
        queryKey: ['votesList', term, mpId, rebellion, dateFrom, dateTo, verdict],
        queryFn: async ({ pageParam = 1 }) => {
            const skip = (pageParam - 1) * PAGE_SIZE;
            const res = await apiFetchVotes({
                term,
                mp_id: mpId ? parseInt(mpId) : undefined,
                rebellion,
                skip,
                limit: PAGE_SIZE,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                verdict: verdict || undefined
            });
            return {
                items: res.items,
                total: res.total,
                nextPage: res.items.length === PAGE_SIZE ? pageParam + 1 : undefined
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    const expandSearchQuery = (query: string): string[] => {
        const synonyms: Record<string, string[]> = {
            'aborcja': ['terminacja', 'ciąż', 'płód', 'życie poczęte'],
            'podatki': ['danin', 'akcyza', 'vat', 'pit', 'cit'],
            'rolnictwo': ['zboż', 'ukrai', 'pasz', 'nawoz'],
            'klimat': ['węgiel', 'ets', 'ozon', 'odnawial'],
            'prawo': ['kodeks', 'sąd', 'trybunał', 'wyrok'],
            'zdrowie': ['szpital', 'lek', 'medycz', 'pacjent'],
            'edukacja': ['szkoł', 'nauczyciel', 'uczeń', 'oświat'],
        };
        const lowerQuery = query.toLowerCase();
        const expanded = [lowerQuery];
        Object.keys(synonyms).forEach(key => {
            if (lowerQuery.includes(key)) expanded.push(...synonyms[key]);
        });
        return expanded;
    };

    // Flatten pages and filter
    const allVotes = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

    const { filteredVotes, isContextualSearch } = useMemo(() => {
        if (!searchQuery.trim()) {
            return { filteredVotes: allVotes, isContextualSearch: false };
        }

        const terms = expandSearchQuery(searchQuery);
        const filtered = allVotes.filter(vote => {
            const title = (vote.title || '').toLowerCase();
            const topic = (vote.topic || '').toLowerCase();
            const kind = (vote.kind || '').toLowerCase();
            return terms.some(t => title.includes(t) || topic.includes(t) || kind.includes(t));
        });

        return { filteredVotes: filtered, isContextualSearch: terms.length > 1 };
    }, [searchQuery, allVotes]);

    if (error) {
        console.error('Error fetching votes list:', error);
    }

    return {
        filteredVotes,
        loading: loading || isFetchingNextPage,
        searchQuery,
        setSearchQuery,
        isContextualSearch,
        term,
        page: data?.pages.length || 1,
        setPage: () => fetchNextPage(), // Map setPage to fetchNextPage for compatibility
        hasMore: hasNextPage,
        totalCount: data?.pages[0]?.total || 0,
        pageSize: PAGE_SIZE,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        verdict,
        setVerdict
    };
}
