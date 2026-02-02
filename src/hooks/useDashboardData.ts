import { useQuery } from '@tanstack/react-query';
import { fetchVotes, fetchVoteAnalysis, fetchVoteResults, fetchProcessesCount, fetchVoteResultsDetailed } from '../api';
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

    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['dashboardData', term],
        queryFn: async () => {
            // 1. Fetch Basic Data
            const [{ items: recentVotes, total: votesTotal }, printsTotal] = await Promise.all([
                fetchVotes({ term, limit: 50, has_results: true }),
                fetchProcessesCount(term)
            ]);

            const lastDate = recentVotes[0]?.date || '---';

            // 2. Determine trending topic
            const topics = recentVotes.map((v: any) => v.topic).filter(Boolean) as string[];
            let trendingTopic = 'Legislacja';

            if (topics.length > 0) {
                const counts: Record<string, number> = {};
                topics.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
                trendingTopic = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
            }

            const stats: DashboardStats = {
                mpsCount: 460,
                votesCount: votesTotal || 0,
                printsCount: printsTotal || 0,
                lastSittingDate: lastDate !== '---'
                    ? new Date(lastDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })
                    : 'Brak danych',
                trendingTopic: trendingTopic
            };

            // 3. Fetch Top Vote Details
            let topVote: TopVote | null = null;
            if (recentVotes.length > 0) {
                const topV = recentVotes[0];
                const [analysis, rawResults] = await Promise.all([
                    fetchVoteAnalysis(topV.id.toString()),
                    // Use detailed endpoint which returns all results (no limit)
                    fetchVoteResultsDetailed(topV.id).catch(() => [])
                ]);

                // Map raw results (nested objects) to dashboard format
                const results = Array.isArray(rawResults) ? rawResults.map((r: any) => ({
                    mp_id: r.mp_id,
                    vote: r.result,
                    mps: {
                        id: r.mp?.id || r.mp_id,
                        first_name: r.mp?.first_name || 'Unknown',
                        last_name: r.mp?.last_name || 'MP',
                        club: r.mp?.club || 'N/A',
                        photo_url: r.mp?.photo_url || `/assets/mps/${r.mp_id}.jpg`,
                        seat_number: r.mp?.seat_number
                    }
                })) : [];

                topVote = {
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
                };
            }

            return { stats, topVote };
        },
        // Refetch when term changes
    });

    // Default empty states if data is loading/error
    const stats: DashboardStats = data?.stats || {
        mpsCount: 460,
        votesCount: 0,
        printsCount: 0,
        lastSittingDate: '---',
        trendingTopic: 'Legislacja'
    };

    const topVote = data?.topVote || null;

    if (error) {
        console.error('Dashboard error:', error);
    }

    return { loading, stats, topVote };
}
