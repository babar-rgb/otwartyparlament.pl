import { useState, useEffect } from 'react';
import { fetchMPs, fetchSpeeches, fetchSpeechesCount } from '../api';
import { Speech } from '../types/domain';
import { PARTIES } from '../constants';

export interface MPFilter {
    id: number;
    name: string;
    party: string;
}

import { useSearchParams } from 'react-router-dom';

export function useSpeeches() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const [speeches, setSpeeches] = useState<Speech[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSpeeches, setRecentSpeeches] = useState<Speech[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Filters - Initialize from URL
    const [mps, setMps] = useState<MPFilter[]>([]);
    const [selectedMp, setSelectedMp] = useState<string>(searchParams.get('mp_id') || '');
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const count = await fetchSpeechesCount();
            setTotalCount(count);

            const mpsData = await fetchMPs({ limit: 500 }); // Get most MPs for filters
            setMps(mpsData.map(m => ({
                id: m.id,
                name: `${m.first_name} ${m.last_name}`,
                party: m.club
            })));

            const initialMpId = searchParams.get('mp_id');
            if (initialMpId) {
                // If MP ID is in URL, perform a search immediately
                setHasSearched(true);
                const data = await fetchSpeeches({
                    mp_id: initialMpId,
                    limit: 50
                });
                setSpeeches(data.items);
            } else {
                // Otherwise fetch recent
                const data = await fetchSpeeches({ skip: 0, limit: ITEMS_PER_PAGE });
                setRecentSpeeches(data.items);
            }
        } catch (err) {
            console.error('Error fetching initial speeches data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSpeechesPage = async (page: number = 0) => {
        setLoading(true);
        try {
            const data = await fetchSpeeches({
                skip: page * ITEMS_PER_PAGE,
                limit: ITEMS_PER_PAGE
            });
            setRecentSpeeches(data.items);
        } catch (err) {
            console.error('Error fetching speeches page:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        setHasSearched(true);

        // Update URL with search params just for user convenience/sharing (optional but good practice)
        // For now, let's keep it simple as user asked for Clear Filter fix.

        try {
            const data = await fetchSpeeches({
                q: query,
                mp_id: selectedMp,
                party: selectedParty,
                date_from: dateFrom,
                date_to: dateTo,
                limit: 50
            });
            setSpeeches(data.items);
        } catch (err) {
            console.error('Error searching speeches:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        // 1. Reset Internal State
        setQuery('');
        setSelectedMp('');
        setSelectedParty('');
        setDateFrom('');
        setDateTo('');
        setHasSearched(false);
        setSpeeches([]);

        // 2. Clear URL params
        setSearchParams({});

        // 3. Re-fetch default data (Recent Speeches) because it might be empty if we started directly with a filter
        // Reset to page 0
        setCurrentPage(0);
        fetchSpeechesPage(0);
    };

    return {
        query, setQuery,
        speeches,
        loading,
        recentSpeeches,
        hasSearched,
        totalCount,
        currentPage, setCurrentPage,
        ITEMS_PER_PAGE,
        mps,
        selectedMp, setSelectedMp,
        selectedParty, setSelectedParty,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        handleSearch,
        clearFilters,
        fetchSpeeches: fetchSpeechesPage,
        PARTIES
    };
}
