import { useQuery } from '@tanstack/react-query';
import { fetchMPs, MP } from '../api';

export function useMPsForSearch() {
    return useQuery({
        queryKey: ['mpsSearchList'],
        queryFn: async () => {
            return await fetchMPs({ limit: 1000 });
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
