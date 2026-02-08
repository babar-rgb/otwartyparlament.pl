import { useState, useMemo, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchVotes as apiFetchVotes } from '../api';
import { useTerm } from '../context/TermContext';
import { browserAI } from '../services/BrowserAI';

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
    child_count?: number;
    is_procedural?: boolean;
}

const PAGE_SIZE = 100;

export function useVotesList(mpId?: string | null, rebellion?: boolean) {
    const { term } = useTerm();
    const [searchQuery, setSearchQuery] = useState('');
    const [vector, setVector] = useState<number[] | undefined>(undefined);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [verdict, setVerdict] = useState<string>('');
    const [sitting, setSitting] = useState<number | undefined>(undefined);
    const [showProcedural, setShowProcedural] = useState(false);
    const [groupVotes, setGroupVotes] = useState(true);
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'LAWS' | 'RESOLUTIONS' | 'PERSONAL' | 'PROCEDURAL'>('ALL');
    const [filterTopic, setFilterTopic] = useState<string | undefined>(undefined);

    // Debounce and Generate Embeddings
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsAiLoading(true);
                const vec = await browserAI.getEmbedding(searchQuery);
                if (vec) setVector(vec);
                setIsAiLoading(false);
            } else {
                setVector(undefined);
            }
        }, 500); // 500ms debounce
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: loading,
        error
    } = useInfiniteQuery({
        // Include vector in queryKey so it refetches when vector changes
        queryKey: ['votesList', term, mpId, rebellion, dateFrom, dateTo, verdict, sitting, showProcedural, groupVotes, filterCategory, filterTopic, searchQuery, vector], // Added vector and searchQuery

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
                verdict: verdict || undefined,
                sitting: sitting,
                q: searchQuery || undefined,
                vector: vector, // Pass vector to API
                hide_procedural: !showProcedural,
                grouped: groupVotes,
                category: filterCategory === 'ALL' ? undefined : filterCategory,
                topic: filterTopic
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



    // Flatten pages and filter
    const allVotes = useMemo(() => data?.pages.flatMap(page => page.items) || [], [data]);

    const { filteredVotes, isContextualSearch } = useMemo(() => {
        // Semantic Search is handled by Backend (pgvector)
        // We just verify if we are in search mode for UI styling
        const isSearch = searchQuery.trim().length > 0;
        return { filteredVotes: allVotes, isContextualSearch: isSearch };
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
        setVerdict,
        sitting,
        setSitting,
        showProcedural,
        setShowProcedural,
        groupVotes,
        setGroupVotes,
        filterCategory,
        setFilterCategory,
        filterTopic,
        setFilterTopic,
        isAiLoading
    };
}
