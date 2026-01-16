import { useQuery } from '@tanstack/react-query';
import { fetchEuroMPs } from '../api';

export function useEuroMPsList(term: number = 10) {
    return useQuery({
        queryKey: ['euroMeps', term],
        queryFn: async () => {
            return await fetchEuroMPs({ term, active: true });
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
