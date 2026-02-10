import { useQuery } from '@tanstack/react-query';
import { fetchProcesses, fetchProcessesCount } from '../api';

export function useBillsList(term: number, page: number, limit: number, query?: string, type?: string) {
    // 1. Fetch Total Count
    // Note: total count currently doesn't respect filters in the simple API, but that's acceptable for search
    const { data: totalCount = null } = useQuery({
        queryKey: ['processesCount', term],
        queryFn: () => fetchProcessesCount(term),
        staleTime: 1000 * 60 * 10,
    });

    // 2. Fetch Processes
    const { data: processes = [], isLoading: loading, error } = useQuery({
        queryKey: ['processes', term, page, limit, query, type],
        queryFn: async () => {
            const result = await fetchProcesses({
                skip: page * limit,
                limit: limit,
                term,
                q: query,
                type: type
            });

            // Handle new backend structure { items: [], total: number } or fallback to array
            const data = Array.isArray(result) ? result : (result.items || []);

            return data.map((p: any) => ({
                number: parseInt(p.print_number || '0'),
                title: p.title,
                description: p.description,
                processStartDate: p.process_start_date,
                documentId: p.id,
                type: p.type // Capture type for coloring
            }));
        },
        staleTime: 1000 * 60 * 5,
    });

    return { processes, totalCount, loading, error };
}
