import { useQuery } from '@tanstack/react-query';
import { fetchTopics } from '../api';

export function useTopics(term: number) {
    return useQuery({
        queryKey: ['topics', term],
        queryFn: async () => {
            const topics = await fetchTopics(term);
            return topics;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
