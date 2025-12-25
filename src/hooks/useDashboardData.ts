import { useState, useEffect } from 'react';
import { db } from '../lib/db';
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
        // Safety Force Stop
        const maxWait = setTimeout(() => setLoading(false), 15000);

        const fetchData = async () => {
            // Use Promise.allSettled to prevent one failed request from killing the whole dashboard
            const results = await Promise.allSettled([
                db.from('votes').select('id', { count: 'exact', head: true }).eq('term', term),
                db.from('sejm_prints').select('number', { count: 'exact', head: true }),
                db.from('votes').select('date, ux_category').eq('term', term).order('date', { ascending: false }).limit(20),
                db.from('votes').select(`id, title_clean, date, ux_category, details_json, importance_score`)
                    .eq('term', term)
                    .order('importance_score', { ascending: false })
                    .limit(1)
                    .maybeSingle()
            ]);

            const [votesCountRes, printsCountRes, lastVoteRes, topVoteRes] = results;

            // Process Stats Safe Fallbacks
            const votesCount = votesCountRes.status === 'fulfilled' ? (votesCountRes.value.count || 0) : 0;
            const printsCount = printsCountRes.status === 'fulfilled' ? (printsCountRes.value.count || 0) : 0;
            const lastVotes = lastVoteRes.status === 'fulfilled' ? (lastVoteRes.value.data || []) : [];

            const lastDate = lastVotes[0]?.date || '---';
            const topics = lastVotes.map(v => v.ux_category).filter(Boolean) as string[] || [];
            const mostFrequentTopic = topics.length > 0
                ? topics.sort((a, b) => topics.filter(v => v === a).length - topics.filter(v => v === b).length).pop()
                : 'Legislacja';

            setStats({
                mpsCount: 460, // Constant
                votesCount: votesCount,
                printsCount: printsCount,
                lastSittingDate: lastDate !== '---' ? new Date(lastDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' }) : 'Brak danych',
                trendingTopic: mostFrequentTopic || 'Legislacja'
            });

            // Process Top Vote
            const topV = topVoteRes.status === 'fulfilled' ? topVoteRes.value.data : null;

            if (topV) {
                try {
                    // Optimized: Fetch minimal fields for Hemicycle
                    const [resDataReq, analysisReq] = await Promise.all([
                        // Limit to 460 to enable fast client-side rendering
                        db.from('vote_results').select('vote, mp_id').eq('vote_id', topV.id).limit(460),
                        db.from('vote_analyses').select('summary').eq('vote_id', topV.id).maybeSingle()
                    ]);

                    let enrichedResults: any[] = [];
                    if (resDataReq.data) {
                        const mpIds = resDataReq.data.map(r => r.mp_id);
                        // Optimized: Only fetch what Hemicycle needs (color + name + photo)
                        const { data: mpsData } = await db.from('mps').select('id, name, party, seat_number, photo_url').in('id', mpIds);
                        const mpsMap = new Map(mpsData?.map(mp => [mp.id, mp]) || []);

                        enrichedResults = resDataReq.data.map(r => ({
                            ...r,
                            mps: mpsMap.get(r.mp_id) || null
                        }));
                    }

                    setTopVote({
                        id: topV.id,
                        title: topV.title_clean,
                        date: topV.date,
                        summary: analysisReq.data?.summary || "Trwa analiza treści ustawy przez model AI...",
                        ux_category: topV.ux_category || 'Ogólne',
                        results: enrichedResults
                    });
                } catch (err) {
                    console.error('Failed to fetch top vote details', err);
                    // Even if details fail, showing partial data is better than nothing
                    setTopVote({
                        id: topV.id,
                        title: topV.title_clean,
                        date: topV.date,
                        summary: "Analiza niedostępna.",
                        ux_category: topV.ux_category || 'Ogólne',
                        results: []
                    });
                }
            }
            setLoading(false);
        };

        fetchData().catch(err => {
            console.error('Dashboard fatal error:', err);
            setLoading(false);
        });

        return () => clearTimeout(maxWait);
    }, [term]);

    return { loading, stats, topVote };
}
