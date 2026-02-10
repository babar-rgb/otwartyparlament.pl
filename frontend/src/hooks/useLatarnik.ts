import { useQuery } from '@tanstack/react-query';
import { fetchVotes, fetchVoteResults } from '../api';
import { LATARNIK_VOTES } from '../data/latarnikConfig';

export interface LatarnikVote {
    id: number;
    title: string;
    description: string;
    date: string;
    topic: string;
    sitting: number;
    voting_number: number;
    term: number;
    divide_comment?: string;
    partyStances: Record<string, string>; // 'YES', 'NO', 'ABSTAIN'
}

export interface PartyAlignment {
    party: string;
    alignment: number;
}

export const useLatarnik = () => {
    const { data: votes = [], isLoading: loading, error } = useQuery({
        queryKey: ['latarnikData'],
        queryFn: async () => {
            const mappedVotes = await Promise.all(LATARNIK_VOTES.map(async (config) => {
                const { items } = await fetchVotes({
                    term: 10,
                    sitting: config.sitting,
                    voting_number: config.voting_number
                });

                const dbVote = items.find((v: any) =>
                    v.sitting === config.sitting &&
                    v.voting_number === config.voting_number
                );

                if (!dbVote) {
                    console.warn(`Latarnik vote not found: Sitting ${config.sitting}, Voting ${config.voting_number}`);
                    return null;
                }

                const results = await fetchVoteResults({ vote_id: dbVote.id, limit: 1000 });
                const partyAggregates: Record<string, Record<string, number>> = {};

                results.forEach((r: any) => {
                    const party = r.mp_club;
                    if (!party) return;
                    if (!partyAggregates[party]) partyAggregates[party] = { 'YES': 0, 'NO': 0, 'ABSTAIN': 0 };

                    let voteType = 'ABSTAIN';
                    const rawVote = r.vote?.toUpperCase();
                    if (rawVote === 'ZA' || rawVote === 'YES') voteType = 'YES';
                    else if (rawVote === 'PRZECIW' || rawVote === 'NO') voteType = 'NO';

                    partyAggregates[party][voteType]++;
                });

                const partyStances: Record<string, string> = {};
                Object.entries(partyAggregates).forEach(([party, counts]) => {
                    const total = counts['YES'] + counts['NO'] + counts['ABSTAIN'];
                    if (total < 1) return;

                    if (counts['YES'] > counts['NO'] && counts['YES'] > counts['ABSTAIN']) {
                        partyStances[party] = 'YES';
                    } else if (counts['NO'] > counts['YES'] && counts['NO'] > counts['ABSTAIN']) {
                        partyStances[party] = 'NO';
                    } else {
                        partyStances[party] = 'ABSTAIN';
                    }
                });

                return {
                    id: dbVote.id,
                    title: config.title,
                    description: config.description,
                    date: dbVote.date,
                    topic: config.topic,
                    sitting: dbVote.sitting,
                    voting_number: dbVote.voting_number,
                    term: dbVote.term,
                    divide_comment: config.divide_comment,
                    partyStances
                } as LatarnikVote;
            }));

            const validVotes = mappedVotes.filter((v): v is LatarnikVote => v !== null);

            if (validVotes.length === 0) {
                throw new Error('Brak zmapowanych głosowań w bazie danych.');
            }

            return validVotes;
        },
        staleTime: 1000 * 60 * 60, // 1 hour cache
    });

    const calculateFullResults = async (userAnswers: Record<number, string>) => {
        const partyScores: Record<string, { score: number, total: number }> = {};

        votes.forEach((vote) => {
            const userAction = userAnswers[vote.id];
            if (!userAction) return;

            Object.entries(vote.partyStances).forEach(([party, partyAction]) => {
                if (!partyScores[party]) partyScores[party] = { score: 0, total: 0 };
                partyScores[party].total++;
                if (userAction === partyAction) {
                    partyScores[party].score += 2;
                } else if (userAction === 'ABSTAIN' || partyAction === 'ABSTAIN') {
                    partyScores[party].score += 0.5;
                } else {
                    partyScores[party].score -= 1;
                }
            });
        });

        const partyAlignments = Object.entries(partyScores)
            .map(([party, stats]) => {
                const maxPossible = stats.total * 2;
                const percentage = maxPossible > 0 ? (stats.score / maxPossible) * 100 : 0;
                return {
                    party,
                    alignment: Math.max(0, Math.round(percentage))
                };
            })
            .sort((a, b) => b.alignment - a.alignment);

        return { parties: partyAlignments, mps: [] };
    };

    return {
        votes,
        loading,
        error: error ? (error as Error).message : null,
        calculateFullResults
    };
};
