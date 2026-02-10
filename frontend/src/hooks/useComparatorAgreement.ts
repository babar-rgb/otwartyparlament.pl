import { useQuery } from '@tanstack/react-query';
import { fetchVoteResults, fetchVotes } from '../api';

export function useComparatorAgreement(mpAId: number | undefined, mpBId: number | undefined) {
    return useQuery({
        queryKey: ['comparatorAgreement', mpAId, mpBId],
        queryFn: async () => {
            if (!mpAId || !mpBId) return null;

            // 1. Calculate similarity (agreement rate)
            const [resultsA, resultsB] = await Promise.all([
                fetchVoteResults({ mp_id: mpAId, limit: 200 }),
                fetchVoteResults({ mp_id: mpBId, limit: 200 })
            ]);

            const votesMapA = new Map(resultsA.map((r: any) => [r.vote_id, r.vote]));
            const votesMapB = new Map(resultsB.map((r: any) => [r.vote_id, r.vote]));

            let sharedVotesCount = 0;
            let agreementCount = 0;

            for (const [voteId, resA] of votesMapA) {
                const resB = votesMapB.get(voteId);
                if (resB) {
                    sharedVotesCount++;
                    if (resA === resB) agreementCount++;
                }
            }

            const similarity = sharedVotesCount < 5 ? null : Math.round((agreementCount / sharedVotesCount) * 100);

            // 2. Fetch key votes comparison
            const { items: recentVotes } = await fetchVotes({ limit: 10 });
            const votesWithDecisions = await Promise.all(recentVotes.map(async (vote: any) => {
                try {
                    const results = await fetchVoteResults({ vote_id: vote.id, mp_ids: [mpAId, mpBId] });
                    const voteAResult = results.find((r: any) => r.mp_id === mpAId)?.vote || 'Nieobecny';
                    const voteBResult = results.find((r: any) => r.mp_id === mpBId)?.vote || 'Nieobecny';

                    return {
                        ...vote,
                        voteA: voteAResult,
                        voteB: voteBResult
                    };
                } catch (e) {
                    return { ...vote, voteA: '?', voteB: '?' };
                }
            }));

            const keyVotes = votesWithDecisions.filter(v => v.voteA !== '?' && v.voteB !== '?').slice(0, 5);

            return {
                similarity,
                keyVotes
            };
        },
        enabled: !!mpAId && !!mpBId,
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
