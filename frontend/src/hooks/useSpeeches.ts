import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMPs, fetchSpeeches, fetchSpeechesCount } from '../api';
import { PARTIES } from '../constants';
import { useSearchParams } from 'react-router-dom';

export interface MPFilter {
    id: number;
    name: string;
    party: string;
}

const ITEMS_PER_PAGE = 10;

export function useSpeeches() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(!!searchParams.get('mp_id'));
    const [currentPage, setCurrentPage] = useState(0);

    // Filter states
    const [selectedMp, setSelectedMp] = useState<string>(searchParams.get('mp_id') || '');
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Persistence for search results once triggered
    const [searchTriggered, setSearchTriggered] = useState(!!searchParams.get('mp_id'));

    // 1. Fetch MPs for filter list (cache for an hour)
    const { data: mpsData } = useQuery({
        queryKey: ['mpsFilterList'],
        queryFn: async () => {
            const data = await fetchMPs({ limit: 500 });
            return data.map(m => ({
                id: m.id,
                name: `${m.first_name} ${m.last_name}`,
                party: m.club
            }));
        },
        staleTime: 1000 * 60 * 60,
    });

    // 2. Fetch Total Count
    const { data: totalCount = 0 } = useQuery({
        queryKey: ['speechesCount'],
        queryFn: fetchSpeechesCount,
        staleTime: 1000 * 60 * 10,
    });

    // 3. Main Speeches Query (either recent or search)
    const { data: speechesData, isLoading: loading } = useQuery({
        queryKey: ['speeches', searchTriggered, query, selectedMp, selectedParty, dateFrom, dateTo, currentPage],
        queryFn: async () => {
            if (searchTriggered) {
                const res = await fetchSpeeches({
                    q: query,
                    mp_id: selectedMp,
                    party: selectedParty,
                    date_from: dateFrom,
                    date_to: dateTo,
                    limit: 50 // Search returns more
                });
                return res.items;
            } else {
                const res = await fetchSpeeches({
                    skip: currentPage * ITEMS_PER_PAGE,
                    limit: ITEMS_PER_PAGE
                });
                return res.items;
            }
        },
        staleTime: 1000 * 60 * 2,
    });

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setHasSearched(true);
        setSearchTriggered(true);
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedMp('');
        setSelectedParty('');
        setDateFrom('');
        setDateTo('');
        setHasSearched(false);
        setSearchTriggered(false);
        setCurrentPage(0);
        setSearchParams({});
    };

    return {
        query, setQuery,
        speeches: searchTriggered ? (speechesData || []) : [],
        loading,
        recentSpeeches: !searchTriggered ? (speechesData || []) : [],
        hasSearched,
        totalCount,
        currentPage, setCurrentPage,
        ITEMS_PER_PAGE,
        mps: mpsData || [],
        selectedMp, setSelectedMp,
        selectedParty, setSelectedParty,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        handleSearch,
        clearFilters,
        fetchSpeeches: setCurrentPage, // In Query mode, setting page triggers refetch
        PARTIES
    };
}
