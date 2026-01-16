import { useQuery } from '@tanstack/react-query';
import { fetchMPs } from '../api';
import { getPartyData } from '../constants/parties';

export function usePartiesList() {
    return useQuery({
        queryKey: ['partiesList'],
        queryFn: async () => {
            const mps = await fetchMPs({ active: true, limit: 1000 });

            const counts: Record<string, number> = {};
            (mps || []).forEach((mp: any) => {
                const p = mp.club || 'Niezrzeszeni';
                counts[p] = (counts[p] || 0) + 1;
            });

            return Object.entries(counts).map(([partyKey, count]) => {
                const metadata = getPartyData(partyKey);
                return {
                    id: partyKey,
                    mpCount: count,
                    metadata
                };
            }).sort((a, b) => b.mpCount - a.mpCount);
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
