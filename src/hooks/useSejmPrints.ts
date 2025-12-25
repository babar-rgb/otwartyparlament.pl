import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { SejmPrint } from '../types/domain';

const ITEMS_PER_PAGE = 20; // Reduced from 100 since we now paginate server-side

export function useSejmPrints() {
    const [prints, setPrints] = useState<SejmPrint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [searchTerm, filterSource]);

    useEffect(() => {
        fetchPrints();
    }, [page, searchTerm, filterSource]);

    const fetchPrints = async () => {
        setLoading(true);
        try {
            // Start building the query
            let query = db
                .from('bills')
                .select('*', { count: 'estimated' });

            // Apply Filters
            if (searchTerm) {
                const isNumber = /^\d+$/.test(searchTerm.trim());
                if (isNumber) {
                    query = query.eq('number', searchTerm.trim());
                } else {
                    query = query.ilike('title', `%${searchTerm}%`);
                }
            }

            if (filterSource) {
                // Assuming 'title' or another field indicates source, or if there's a specific 'source' column.
                // Based on previous code: result = result.filter(p => p.title.toLowerCase().includes(filterSource.toLowerCase()));
                // So we use ilike on title.
                query = query.ilike('title', `%${filterSource}%`);
            }

            // Pagination
            const from = page * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;

            // Execute query
            // We order by number descending (parsing logic handled in SQL or just sort by ID/date if number is string)
            // Ideally 'number' should be sortable, but it's often a string "123" or "123-A". 
            // For robust sorting we rely on DB definition. Assuming 'number' or 'id' implies chronological order.
            // Using logic from previous: sorted by number desc.
            // Since custom SQL sorting isn't easy via JS SDK without RPC, we'll try sorting by 'id' desc as proxy for recency, 
            // OR if 'process_id' is chronological. Let's assume 'id' desc. 
            // We order by number descending
            const { data: printsData, error: printsError, count } = await query
                .order('id', { ascending: false }) // changed to ID for stability
                .range(from, to);

            if (printsError) throw printsError;

            if (count !== null) setTotalCount(count);

            const fetchedPrints = (printsData || []) as SejmPrint[];

            // 2. Fetch Insights ONLY for the current page items
            if (fetchedPrints.length > 0) {
                const printNumbers = fetchedPrints.map(p => p.number).filter(Boolean); // Filter nulls

                if (printNumbers.length === 0) {
                    setPrints(fetchedPrints);
                    return;
                }

                const { data: insightsData, error: insightsError } = await db // CHANGED FROM supabase
                    .from('bill_insights')
                    .select('print_number, ai_summary, justification_text, document_type')
                    .in('print_number', printNumbers);

                if (!insightsError && insightsData) {
                    const insightsMap = new Map(insightsData.map((i: any) => [i.print_number, i]));

                    // Merge insights
                    const merged = fetchedPrints.map(p => ({
                        ...p,
                        ai_summary: insightsMap.get(p.number)?.ai_summary,
                        justification_text: insightsMap.get(p.number)?.justification_text,
                        document_type: insightsMap.get(p.number)?.document_type
                    }));
                    setPrints(merged);
                } else {
                    setPrints(fetchedPrints);
                }
            } else {
                setPrints([]);
            }

        } catch (error) {
            console.error('Error fetching prints:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        prints, // This acts as "filteredPrints" now
        loading,
        searchTerm,
        setSearchTerm,
        filterSource,
        setFilterSource,
        page,
        setPage,
        totalCount,
        ITEMS_PER_PAGE
    };
}
