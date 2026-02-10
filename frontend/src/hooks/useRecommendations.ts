import { useQuery } from '@tanstack/react-query';
import { fetchRecommendations } from '../api';

export function useRecommendations(interests: string) {
    return useQuery({
        queryKey: ['recommendations', interests],
        queryFn: async () => {
            if (!interests || interests.length < 3) return [];
            return await fetchRecommendations(interests);
        },
        enabled: interests.length >= 3,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
