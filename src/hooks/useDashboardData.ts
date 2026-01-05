import { useState, useEffect } from 'react';
import { fetchVotes, fetchVoteAnalysis, fetchVoteResults, fetchProcessesCount } from '../api';
import { useTerm } from '../context/TermContext';

export interface DashboardStats {
    mpsCount: number;
    votesCount: number;
    printsCount: number;
    lastSittingDate: string;
    trendingTopic: string;
}

export interface TopVote {
    id: number;
    title: string;
    date: string;
    summary: string;
    ux_category: string;
    results: any[];
}

export function useDashboardData() {
    const { term } = useTerm();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        mpsCount: 460,
        votesCount: 0,
        printsCount: 0,
        lastSittingDate: '---',
        trendingTopic: 'Legislacja'
    });
    const [topVote, setTopVote] = useState<TopVote | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only fetch votes that HAVE results to avoid empty hemicycle
                const { items: lastVotes, total: votesTotal } = await fetchVotes({ term, limit: 20, has_results: true });
                const printsTotal = await fetchProcessesCount(term);

                const lastDate = lastVotes[0]?.date || '---';
                const topics = lastVotes.map((v: any) => v.topic).filter(Boolean) as string[];
                const mostFrequentTopic = topics.length > 0
                    ? [...topics].sort((a, b) => topics.filter(v => v === a).length - topics.filter(v => v === b).length).pop()
                    : 'Legislacja';

                setStats({
                    mpsCount: 460,
                    votesCount: votesTotal || 0,
                    printsCount: printsTotal || 0,
                    lastSittingDate: lastDate !== '---' ? new Date(lastDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' }) : 'Brak danych',
                    trendingTopic: mostFrequentTopic || 'Legislacja'
                });

                if (lastVotes.length > 0) {
                    const topV = lastVotes[0];
                    const analysis = await fetchVoteAnalysis(topV.id.toString());
                    const results = await fetchVoteResults({ vote_id: topV.id, limit: 460 });

                    setTopVote({
                        id: topV.id,
                        title: topV.title_clean || topV.title,
                        date: topV.date,
                        summary: analysis?.summary || "Trwa analiza treści ustawy...",
                        ux_category: topV.topic || 'Ogólne',
                        results: results.map((r: any) => ({
                            ...r,
                            mps: {
                                id: r.mp_id,
                                first_name: r.mp_first_name,
                                last_name: r.mp_last_name,
                                club: r.mp_club,
                                photo_url: `/assets/mps/${r.mp_id}.jpg`
                            }
                        }))
                    });
                }
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [term]);

    return { loading, stats, topVote };
}
