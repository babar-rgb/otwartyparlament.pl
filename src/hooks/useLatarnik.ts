import { useState, useEffect } from 'react';
import { db } from '../lib/db';

export interface LatarnikVote {
    id: number;
    title: string;
    description: string;
    date: string;
    topic: string;
    partyStances: Record<string, string>; // 'YES', 'NO', 'ABSTAIN'
}

export interface PartyAlignment {
    party: string;
    alignment: number;
}

export interface MpAlignment {
    id: number;
    name: string;
    photo_url: string;
    party: string;
    slug: string;
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

            // 1. Fetch a pool of important votes
            const { data: votesData, error: votesError } = await db
                .from('votes')
                .select('*')
                .eq('term', 10)
                .gte('importance', 7)
                .order('importance', { ascending: false })
                .limit(40);

            if (votesError) throw votesError;
            if (!votesData || votesData.length === 0) throw new Error('Nie znaleziono ważnych głosowań');

            // Shuffle and pick 12 for variety
            const shuffled = [...votesData].sort(() => 0.5 - Math.random()).slice(0, 12);
            const voteIds = shuffled.map(v => v.id);

            // 2. Fetch results for these votes to calculate party stances
            const { data: resultsData, error: resultsError } = await db
                .from('vote_results')
                .select('vote_id, result, mps(party)')
                .in('vote_id', voteIds);

            if (resultsError) throw resultsError;

            // 3. Aggregate stances per party per vote
            const processedVotes: LatarnikVote[] = shuffled.map(vote => {
                const voteResults = resultsData?.filter(r => r.vote_id === vote.id) || [];
                const partyAggregates: Record<string, Record<string, number>> = {};

                voteResults.forEach(r => {
                    // PostgREST might return mps as an object or an array depending on internal cache/types
                    const mpData = Array.isArray(r.mps) ? r.mps[0] : r.mps;
                    const party = mpData?.party;

                    if (!party) return;
                    if (!partyAggregates[party]) partyAggregates[party] = { 'YES': 0, 'NO': 0, 'ABSTAIN': 0 };
                    if (partyAggregates[party][r.result] !== undefined) {
                        partyAggregates[party][r.result]++;
                    }
                });

                const partyStances: Record<string, string> = {};
                Object.entries(partyAggregates).forEach(([party, counts]) => {
                    const total = counts['YES'] + counts['NO'] + counts['ABSTAIN'];
                    if (total < 3) return; // Skip parties with too few votes in this session

                    if (counts['YES'] > counts['NO'] && counts['YES'] > counts['ABSTAIN']) {
                        partyStances[party] = 'YES';
                    } else if (counts['NO'] > counts['YES'] && counts['NO'] > counts['ABSTAIN']) {
                        partyStances[party] = 'NO';
                    } else {
                        partyStances[party] = 'ABSTAIN';
                    }
                });

                return {
                    id: vote.id,
                    title: vote.title_raw || vote.title,
                    description: vote.description || vote.topic || 'Analiza głosowania w toku...',
                    date: vote.date,
                    topic: vote.topic || 'Ogólne',
                    partyStances
                };
            });

            setVotes(processedVotes);
        } catch (err: any) {
            console.error('Latarnik Data Fetch Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const calculateFullResults = async (userAnswers: Record<number, string>) => {
        // Party results

        // Define party groupings for consolidation (mostly technical sub-groups)
        const groupMapping: Record<string, string> = {
            'Polska2050-TD': 'Polska2050',
            'PSL-TD': 'PSL',
            'KP': 'PSL', // Koalicja Polska is mostly PSL
            'LD': 'Lewica', // Lewica Demokratyczna
        };

        const partyScores: Record<string, { score: number, total: number }> = {};

        votes.forEach(vote => {
            const userAction = userAnswers[vote.id];
            if (!userAction) return;

            Object.entries(vote.partyStances).forEach(([rawParty, partyAction]) => {
                const party = groupMapping[rawParty] || rawParty;
                if (!partyScores[party]) partyScores[party] = { score: 0, total: 0 };

                partyScores[party].total++;
                if (userAction === partyAction) partyScores[party].score++;
                else if (userAction === 'ABSTAIN' || partyAction === 'ABSTAIN') partyScores[party].score += 0.4;
            });
        });

        const partyAlignments = Object.entries(partyScores)
            .map(([party, stats]) => ({
                party,
                alignment: stats.total > 0 ? Math.round((stats.score / stats.total) * 100) : 0
            }))
            .sort((a, b) => b.alignment - a.alignment);

        // Individual MP Twin
        try {
            const { data: mpVotesData, error: mpVotesError } = await db
                .from('vote_results')
                .select('mp_id, vote_id, result, mps(id, name, photo_url, party, slug)')
                .in('vote_id', votes.map(v => v.id));

            if (mpVotesError) throw mpVotesError;

            const mpTally: Record<number, { score: number, total: number, mp: any }> = {};
            mpVotesData.forEach(rv => {
                const mpId = rv.mp_id;
                if (!mpTally[mpId]) {
                    const mpData = Array.isArray(rv.mps) ? rv.mps[0] : rv.mps;
                    mpTally[mpId] = { score: 0, total: 0, mp: mpData };
                }
                const userAction = userAnswers[rv.vote_id];
                const mpAction = rv.result === 'YES' ? 'YES' : rv.result === 'NO' ? 'NO' : 'ABSTAIN';
                if (userAction) {
                    mpTally[mpId].total++;
                    if (userAction === mpAction) mpTally[mpId].score++;
                    else if (userAction === 'ABSTAIN' || mpAction === 'ABSTAIN') mpTally[mpId].score += 0.4;
                }
            });

            const sortedMps = Object.values(mpTally)
                .filter(item => item.mp && item.mp.name) // Ensure we have valid MP data
                .map(item => ({
                    ...item.mp,
                    alignment: item.total > 0 ? Math.round((item.score / item.total) * 100) : 0
                }))
                .sort((a, b) => b.alignment - a.alignment)
                .slice(0, 5);

            return {
                parties: partyAlignments.filter(p => p.party),
                mps: sortedMps
            };
        } catch (err) {
            console.error('MP matching error:', err);
            return { parties: partyAlignments, mps: [] };
        }
    };

    return { votes, loading, error, calculateFullResults };
};
