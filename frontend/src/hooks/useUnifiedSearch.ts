import { useQuery } from '@tanstack/react-query';
import { unifiedSearch } from '../api';

export function useUnifiedSearch(query: string, term: string, type: string | null, expanded?: string) {
    return useQuery({
        queryKey: ['unifiedSearch', query, term, type, expanded],
        queryFn: async () => {
            const data = await unifiedSearch({
                q: query,
                period: term !== 'all' ? term : undefined,
                type: type || undefined,
                expanded
            });

            // Separate MPs from other results
            const mps = data.filter((r: any) => r.type === 'mp').map((r: any) => r.data);
            const results = data.filter((r: any) => r.type !== 'mp');

            return { mps, results };
        },
        enabled: query.length >= 2,
        staleTime: 1000 * 60 * 5, // 5 minutes cache for same query
    });
}
