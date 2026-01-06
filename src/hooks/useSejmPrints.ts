import { useState, useEffect } from 'react';
import { fetchProcesses } from '../api';
import { SejmPrint } from '../types/domain';

const ITEMS_PER_PAGE = 20;

export function useSejmPrints() {
    const [prints, setPrints] = useState<SejmPrint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        setPage(0);
    }, [searchTerm, filterSource]);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const skip = page * ITEMS_PER_PAGE;
                const { items, total } = await fetchProcesses({
                    skip,
                    limit: ITEMS_PER_PAGE,
                    q: searchTerm
                });

                setPrints(items.map((p: any) => ({
                    id: p.id,
                    number: p.number,
                    term: p.term,
                    title: p.title,
                    type: p.type,
                    ai_summary: '',
                    justification_text: '',
                    document_type: ''
                })));
                setTotalCount(total);
            } catch (err) {
                console.error('Error fetching prints:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [page, searchTerm, filterSource]);

    return { prints, loading, searchTerm, setSearchTerm, filterSource, setFilterSource, page, setPage, totalCount, ITEMS_PER_PAGE };
}
