import { useQuery } from '@tanstack/react-query';
import { fetchPersonasFeed } from '../api';

export function usePersonasFeed(persona: string | null, limit: number = 20) {
    return useQuery({
        queryKey: ['personasFeed', persona, limit],
        queryFn: async () => {
            if (!persona) return [];
            return await fetchPersonasFeed(persona, limit);
        },
        enabled: !!persona,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });
}
