import { useQuery } from '@tanstack/react-query';
import { fetchProcesses } from '../api';

export function useLegislativeProcesses(options?: { q?: string; term?: number; limit?: number }) {
    return useQuery({
        queryKey: ['legislativeProcesses', options],
        queryFn: async () => {
            const data = await fetchProcesses(options);
            // Ensure it returns items array and total count
            return {
                items: data.items || [],
                total: data.total || 0
            };
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
