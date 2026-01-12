/* 
 * CRITICAL HOOK - DO NOT MODIFY WITHOUT EXPLICIT USER INSTRUCTION
 * 
 * VITAL RULES:
 * 1. Pagination: MUST use .range() with PAGE_SIZE = 100.
 * 2. Search: Syncs with filteredVotes for the main archive.
 * 
 * This file is locked for "vibe coding" regressions.
 */

import { useState, useEffect } from 'react';
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

export function useVotesList(mpId?: string | null, rebellion?: boolean) {
    const { term } = useTerm();
    const [votes, setVotes] = useState<VoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredVotes, setFilteredVotes] = useState<VoteItem[]>([]);
    const [isContextualSearch, setIsContextualSearch] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 100;

    // Contextual search expansion (mock logic as placeholder for advanced AI search)
    // This mirrors the logic from the conversation "Enabling Contextual Search"
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
            if (lowerQuery.includes(key)) {
                expanded.push(...synonyms[key]);
            }
        });

        return expanded;
    };

    useEffect(() => {
        fetchVotes();
    }, [term, page]); // Refetch if term or page changes

    useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    useEffect(() => {
        filterVotes();
    }, [searchQuery, votes]);

    const fetchVotes = async () => {
        setLoading(true);
        try {
            const skip = (page - 1) * PAGE_SIZE;
            const limit = PAGE_SIZE;

            const { items: mappedData, total: count } = await apiFetchVotes({
                term,
                mp_id: mpId ? parseInt(mpId) : undefined,
                rebellion,
                skip,
                limit
            });

            if (count !== null) setTotalCount(count);

            if (page === 1) {
                setVotes(mappedData);
            } else {
                setVotes(prev => [...prev, ...mappedData]);
            }

            setHasMore(mappedData.length === PAGE_SIZE);
        } catch (error) {
            console.error('Error fetching votes:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterVotes = () => {
        if (!searchQuery.trim()) {
            setFilteredVotes(votes);
            setIsContextualSearch(false);
            return;
        }

        const terms = expandSearchQuery(searchQuery);
        setIsContextualSearch(terms.length > 1);

        const filtered = votes.filter(vote => {
            const title = (vote.title || '').toLowerCase();
            const topic = (vote.topic || '').toLowerCase(); // Mapping 'kind' or 'topic' from DB depending on schema
            const kind = (vote.kind || '').toLowerCase();

            return terms.some(term =>
                title.includes(term) ||
                topic.includes(term) ||
                kind.includes(term)
            );
        });

        setFilteredVotes(filtered);
    };

    return {
        filteredVotes,
        loading,
        searchQuery,
        setSearchQuery,
        isContextualSearch,
        term,
        page,
        setPage,
        hasMore,
        totalCount,
        pageSize: PAGE_SIZE
    };
}
