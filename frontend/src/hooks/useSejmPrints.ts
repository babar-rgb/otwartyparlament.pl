import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProcesses } from '../api';
import { SejmPrint } from '../types/domain';

const ITEMS_PER_PAGE = 20;

export function useSejmPrints() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [page, setPage] = useState(0);

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['sejmPrints', searchTerm, filterSource, page],
        queryFn: async () => {
            const skip = page * ITEMS_PER_PAGE;
            const res = await fetchProcesses({
                skip,
                limit: ITEMS_PER_PAGE,
                q: searchTerm,
                type: filterSource || undefined,
                only_bills: true
            });

            const prints: SejmPrint[] = res.items.map((p: any) => ({
                id: p.id,
                number: p.number,
                term: p.term,
                title: p.title,
                type: p.type,
                ai_summary: p.analysis?.summary || p.description || '',
                pros: p.analysis?.pros || [],
                cons: p.analysis?.cons || [],
                justification_text: '',
                document_type: p.type
            }));

            return { prints, total: res.total };
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    if (error) {
        console.error('Error fetching prints:', error);
    }

    return {
        prints: data?.prints || [],
        loading,
        searchTerm,
        setSearchTerm: (value: string) => { setSearchTerm(value); setPage(0); },
        filterSource,
        setFilterSource: (value: string | null) => { setFilterSource(value); setPage(0); },
        page,
        setPage,
        totalCount: data?.total || 0,
        ITEMS_PER_PAGE
    };
}
