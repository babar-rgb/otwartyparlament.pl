import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { Speech } from '../types/domain';
import { PARTIES } from '../constants';

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
        const { data } = await db.from('mps').select('id, first_name, last_name, club').order('last_name');
        if (data) setMps(data.map((m: any) => ({
            id: m.id,
            name: `${m.first_name} ${m.last_name}`,
            party: m.club
        })));
    };

    const fetchTotalCount = async () => {
        const { count } = await db
            .from('speeches')
            .select('*', { count: 'exact', head: true });
        if (count) setTotalCount(count);
    };

    const fetchSpeeches = async (page: number = 0) => {
        setLoading(true);
        try {
            const rangeStart = page * ITEMS_PER_PAGE;
            const rangeEnd = rangeStart + ITEMS_PER_PAGE - 1;

            const { data, error } = await db
                .from('speeches')
                .select(`
          *,
          mp:mps(id, first_name, last_name, club, photo_url)
        `)
                .order('date', { ascending: false })
                .order('id', { ascending: false })
                .range(rangeStart, rangeEnd);

            if (error) throw error;
            // Type assertion: Join returns array structure, cast via unknown
            setRecentSpeeches((data ?? []) as any[]);
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
            let queryBuilder = db
                .from('speeches')
                .select(`
          *,
          mp:mps(id, first_name, last_name, club, photo_url)
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
                // Use !inner to filter by joined generic relationship
                queryBuilder = db
                    .from('speeches')
                    .select(`
                     *,
                     mp:mps!inner(id, first_name, last_name, club, photo_url)
                 `)
                    .eq('mp.club', selectedParty);

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
            // Type assertion: Join returns data matching our schema
            setSpeeches((data ?? []) as Speech[]);
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
        fetchSpeeches,
        PARTIES // Exposed to component
    };
}
