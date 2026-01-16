import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [mp, setMp] = useState<MP | null>(null);
    const [voteHistory, setVoteHistory] = useState<VoteHistoryItem[]>([]);

    const [recentSpeeches, setRecentSpeeches] = useState<any[]>([]);
    const [keyVotes, setKeyVotes] = useState<VoteHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [interpellationCount, setInterpellationCount] = useState<number>(0);
    const [stats, setStats] = useState<Record<string, any>>({});
    const [relations, setRelations] = useState<MPRelation[]>([]);
    const [digitizedDeclarations, setDigitizedDeclarations] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            if (!idOrSlug) return;
            try {
                const mpData = await fetchMP(idOrSlug);
                setMp(mpData);

                if (/^\d+$/.test(idOrSlug) && mpData.slug) {
                    navigate(`/poslowie/${mpData.slug}`, { replace: true });
                    return;
                }

                const [speeches, votesData, interps, mpStats, mpRelations, mpDeclarations] = await Promise.all([
                    fetchSpeeches({ mp_id: mpData.id, limit: 5 }),
                    fetchVotes({ mp_id: mpData.id, limit: 20 }),
                    fetchInterpellations({ mp_id: mpData.id, limit: 100 }),
                    fetchMPStats(mpData.id),
                    fetchMPAlignment(mpData.id),
                    fetchMPDeclarations(mpData.id)
                ]);

                setRecentSpeeches(speeches.items);
                setInterpellationCount(interps.length);
                setStats(mpStats);
                setRelations(mpRelations);
                setDigitizedDeclarations(mpDeclarations);

                // Map standard Vote items to VoteHistoryItem structure
                const mappedHistory = votesData.items.map((v: any) => ({
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
                setVoteHistory(mappedHistory);
                setKeyVotes(mappedHistory.slice(0, 5));
            } catch (err) {
                console.error('Error fetching MP profile:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [idOrSlug, navigate]);

    return { mp, voteHistory, keyVotes, digitizedDeclarations, recentSpeeches, loading, interpellationCount, stats, relations };
}
