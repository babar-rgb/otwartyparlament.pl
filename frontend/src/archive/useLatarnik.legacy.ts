import { useState, useEffect } from 'react';
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
    const [votes, setVotes] = useState<LatarnikVote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchLatarnikData();
    }, []);

    const fetchLatarnikData = async () => {
        try {
            setLoading(true);

            // Fetch specific votes required for the test
            const mappedVotes = await Promise.all(LATARNIK_VOTES.map(async (config) => {
                // Fetch the specific vote by sitting and voting number
                // We ask for term=10 explicitly, though it might be dynamic in future
                const { items } = await fetchVotes({
                    term: 10,
                    sitting: config.sitting,
                    voting_number: config.voting_number
                });

                // Find the exact vote in the returned items (api returns a list)
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
                    const party = r.mp_club; // Standardize field name from API
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
                // Only throw if we found NOTHING. Partial results are better than nothing.
                throw new Error('Brak zmapowanych głosowań w bazie danych.');
            }

            setVotes(validVotes);
        } catch (err: any) {
            console.error('Latarnik Data Fetch Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

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
        }); // This brace closes the `votes.forEach` callback

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

        return { parties: partyAlignments, mps: [] }; // MPs twins disabled for now to simplify
    };

    return { votes, loading, error, calculateFullResults };
};
