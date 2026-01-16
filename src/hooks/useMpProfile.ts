import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchMP, fetchSpeeches, fetchVotes, fetchInterpellations, fetchMPStats, fetchMPAlignment, fetchMPDeclarations } from '../api';
import { MP, MPRelation } from '../types/domain';

export interface VoteHistoryItem {
    vote: string;
    votes: {
        id: number;
        sitting: number;
        voting_number: number;
        title_clean: string;
        title_raw?: string;
        date: string;
        verdict: string;
        term: number;
    };
    isFinal?: boolean;
}

export function useMpProfile(idOrSlug?: string) {
    const navigate = useNavigate();

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['mpProfile', idOrSlug],
        queryFn: async () => {
            if (!idOrSlug) return null;

            // 1. Fetch Core MP Data
            const mpData = await fetchMP(idOrSlug);

            // 2. Concurrent fetching for the rest
            const [speeches, votesData, interps, mpStats, mpRelations, mpDeclarations] = await Promise.all([
                fetchSpeeches({ mp_id: mpData.id, limit: 5 }),
                fetchVotes({ mp_id: mpData.id, limit: 20 }),
                fetchInterpellations({ mp_id: mpData.id, limit: 100 }),
                fetchMPStats(mpData.id),
                fetchMPAlignment(mpData.id),
                fetchMPDeclarations(mpData.id)
            ]);

            // 3. Data Mapping
            const voteHistory = votesData.items.map((v: any) => ({
                vote: (v.mpVote === 'YES' || v.mpVote === 'Za') ? 'YES' :
                    (v.mpVote === 'NO' || v.mpVote === 'Przeciw') ? 'NO' :
                        (v.mpVote === 'ABSTAIN' || v.mpVote === 'Wstrzymał się') ? 'ABSTAIN' :
                            'ABSENT',
                votes: {
                    id: v.id,
                    sitting: v.sitting,
                    voting_number: v.voting_number,
                    title_clean: v.title_clean || v.title,
                    title_raw: v.title_raw,
                    date: v.date,
                    verdict: v.verdict,
                    term: v.term
                },
                isFinal: true
            }));

            return {
                mp: mpData,
                recentSpeeches: speeches.items,
                interpellationCount: interps.length,
                stats: mpStats,
                relations: mpRelations as MPRelation[],
                digitizedDeclarations: mpDeclarations,
                voteHistory,
                keyVotes: voteHistory.slice(0, 5)
            };
        },
        enabled: !!idOrSlug,
        staleTime: 1000 * 60 * 15, // MP personal data doesn't change every minute
    });

    // Handle slug redirect
    useEffect(() => {
        if (data?.mp && /^\d+$/.test(idOrSlug || "") && data.mp.slug) {
            navigate(`/poslowie/${data.mp.slug}`, { replace: true });
        }
    }, [data, idOrSlug, navigate]);

    if (error) {
        console.error('Error fetching MP profile:', error);
    }

    return {
        mp: data?.mp || null,
        voteHistory: data?.voteHistory || [],
        keyVotes: data?.keyVotes || [],
        digitizedDeclarations: data?.digitizedDeclarations || [],
        recentSpeeches: data?.recentSpeeches || [],
        loading,
        interpellationCount: data?.interpellationCount || 0,
        stats: data?.stats || {},
        relations: data?.relations || []
    };
}
