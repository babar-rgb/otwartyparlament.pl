import { useQuery } from '@tanstack/react-query';
import { fetchMPs } from '../api';

export function useMPs(term: number) {
    return useQuery({
        queryKey: ['mps', term],
        queryFn: async () => {
            const data = await fetchMPs({
                term,
                active: term === 10 ? true : undefined,
                limit: 1000
            });

            // Client-side shuffle (Fisher-Yates) 
            const shuffled = [...data];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}
