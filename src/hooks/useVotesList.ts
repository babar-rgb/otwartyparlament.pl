import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { useTerm } from '../context/TermContext';

export interface VoteItem {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title: string;
    topic: string; // "Kind" in DB is usually mapped to UI "topic" or similar
    kind?: string;
    title_clean?: string;
    term: number;
}

export function useVotesList() {
    const { term } = useTerm();
    const [votes, setVotes] = useState<VoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredVotes, setFilteredVotes] = useState<VoteItem[]>([]);
    const [isContextualSearch, setIsContextualSearch] = useState(false);

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
    }, [term]); // Refetch if term context changes

    useEffect(() => {
        filterVotes();
    }, [searchQuery, votes]);

    const fetchVotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await db
                .from('votes')
                .select('*')
                .eq('term', term)
                .order('date', { ascending: false })
                .order('voting_number', { ascending: false });

            if (error) throw error;
            setVotes(data || []);
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
        term
    };
}
