import { useQuery } from '@tanstack/react-query';
import { fetchEuroMP, fetchEuroMPHistory } from '../api';

export function useEuroMPProfile(id: string | undefined) {
    return useQuery({
        queryKey: ['euroMPProfile', id],
        queryFn: async () => {
            if (!id) return null;

            const mpData = await fetchEuroMP(id);

            let voteHistory = [];
            if (mpData && mpData.api_id) {
                voteHistory = await fetchEuroMPHistory(mpData.api_id);
            }

            return { mp: mpData, voteHistory };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
