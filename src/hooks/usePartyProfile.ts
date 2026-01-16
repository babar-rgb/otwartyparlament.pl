import { useQuery } from '@tanstack/react-query';
import { fetchMPs } from '../api';

export function usePartyProfile(clubId: string | undefined) {
    return useQuery({
        queryKey: ['partyProfile', clubId],
        queryFn: async () => {
            if (!clubId) return [];
            const data = await fetchMPs({ limit: 1000, active: true });
            // local filter
            return data.filter((mp: any) => mp.club === clubId);
        },
        enabled: !!clubId,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
