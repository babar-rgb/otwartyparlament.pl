import { useQuery } from '@tanstack/react-query';
import { fetchProcess } from '../api';

export function useLegislativeProcessDetails(id: string | undefined) {
    return useQuery({
        queryKey: ['legislativeProcessDetails', id],
        queryFn: async () => {
            if (!id) return null;
            return await fetchProcess(id);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
