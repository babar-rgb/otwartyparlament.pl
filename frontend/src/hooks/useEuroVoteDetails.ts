import { useQuery } from '@tanstack/react-query';
import { fetchEuroVote, fetchEuroVoteResults } from '../api';

export function useEuroVoteDetails(id: string | undefined) {
    return useQuery({
        queryKey: ['euroVoteDetails', id],
        queryFn: async () => {
            if (!id) return null;

            const [vote, results] = await Promise.all([
                fetchEuroVote(id),
                fetchEuroVoteResults(id)
            ]);

            return { vote, results: results || [] };
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}
