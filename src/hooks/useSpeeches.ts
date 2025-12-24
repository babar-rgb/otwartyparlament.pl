import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Speech } from '../types/domain';

export interface MPFilter {
    id: number;
    name: string;
    party: string;
}

export function useSpeeches() {
    const [query, setQuery] = useState('');
    const [speeches, setSpeeches] = useState<Speech[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSpeeches, setRecentSpeeches] = useState<Speech[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Filters
    const [mps, setMps] = useState<MPFilter[]>([]);
    const [selectedMp, setSelectedMp] = useState<string>('');
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchSpeeches(0);
        fetchTotalCount();
        fetchMps();
    }, []);

    const fetchMps = async () => {
        const { data } = await supabase.from('mps').select('id, name, party').order('name');
        if (data) setMps(data);
    };

    const fetchTotalCount = async () => {
        const { count } = await supabase
            .from('speeches')
            .select('*', { count: 'exact', head: true });
        if (count) setTotalCount(count);
    };

    const fetchSpeeches = async (page: number = 0) => {
        setLoading(true);
        try {
            const rangeStart = page * ITEMS_PER_PAGE;
            const rangeEnd = rangeStart + ITEMS_PER_PAGE - 1;

            const { data, error } = await supabase
                .from('speeches')
                .select(`
          *,
          mp:mps(id, name, party, photo_url)
        `)
                .order('date', { ascending: false })
                .order('id', { ascending: false })
                .range(rangeStart, rangeEnd);

            if (error) throw error;
            setRecentSpeeches((data as unknown as Speech[]) || []); // Casting to Speech[]
        } catch (err) {
            console.error('Error fetching speeches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        setHasSearched(true);
        try {
            let queryBuilder = supabase
                .from('speeches')
                .select(`
          *,
          mp:mps(id, name, party, photo_url)
        `);

            // Text Search
            if (query.trim()) {
                queryBuilder = queryBuilder.ilike('content', `%${query}%`);
            }

            // Filters
            if (selectedMp) {
                queryBuilder = queryBuilder.eq('mp_id', selectedMp);
            }
            if (selectedParty) {
                // Workaround: Filter by speaker_party if it exists on speeches, or use !inner on join
                // We use !inner to filter by joined table properties
                queryBuilder = supabase
                    .from('speeches')
                    .select(`
                     *,
                     mp:mps!inner(id, name, party, photo_url)
                 `)
                    .eq('mp.party', selectedParty);

                if (query.trim()) queryBuilder = queryBuilder.ilike('content', `%${query}%`);
                if (selectedMp) queryBuilder = queryBuilder.eq('mp_id', selectedMp);
            }

            if (dateFrom) {
                queryBuilder = queryBuilder.gte('date', dateFrom);
            }
            if (dateTo) {
                queryBuilder = queryBuilder.lte('date', dateTo);
            }

            const { data, error } = await queryBuilder
                .order('date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSpeeches((data as unknown as Speech[]) || []);
        } catch (err) {
            console.error('Error searching speeches:', err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setQuery('');
        setSelectedMp('');
        setSelectedParty('');
        setDateFrom('');
        setDateTo('');
        setHasSearched(false);
        setSpeeches([]);
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
        fetchSpeeches // exposed for pagination
    };
}
