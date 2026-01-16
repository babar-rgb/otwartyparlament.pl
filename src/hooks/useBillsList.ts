import { useQuery } from '@tanstack/react-query';
import { fetchProcesses, fetchProcessesCount } from '../api';

export function useBillsList(term: number, page: number, limit: number) {
    // 1. Fetch Total Count
    const { data: totalCount = null } = useQuery({
        queryKey: ['processesCount', term],
        queryFn: () => fetchProcessesCount(term),
        staleTime: 1000 * 60 * 10,
    });

    // 2. Fetch Processes
    const { data: processes = [], isLoading: loading, error } = useQuery({
        queryKey: ['processes', term, page, limit],
        queryFn: async () => {
            const data = await fetchProcesses({
                skip: page * limit,
                limit: limit,
                term
            });

            return (data || []).map((p: any) => ({
                number: parseInt(p.print_number || '0'),
                title: p.title,
                description: p.description,
                processStartDate: p.process_start_date,
                documentId: p.id
            }));
        },
        staleTime: 1000 * 60 * 5,
    });

    return { processes, totalCount, loading, error };
}
