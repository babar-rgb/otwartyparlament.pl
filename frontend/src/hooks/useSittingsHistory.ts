import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../api';

export function useSittingsHistory(term: number) {
    return useQuery({
        queryKey: ['sittingsHistory', term],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/sittings/summaries?term=${term}`);
            if (!response.ok) throw new Error('Failed to fetch sittings history');
            return await response.json();
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
