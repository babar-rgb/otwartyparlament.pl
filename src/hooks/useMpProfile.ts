import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/db';
import { MP } from '../api';

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
        category?: string;
        term: number;
    };
}

export interface AssetDeclaration {
    id: number;
    pdf_url: string;
    year: string;
    summary: string;
    file_path?: string;
    parsed_content: {
        savings: number;
        real_estate: string[];
        income: number;
        car: string[];
    };
}

export function useMpProfile(idOrSlug?: string) {
    const navigate = useNavigate();
    const [mp, setMp] = useState<MP | null>(null);
    const [voteHistory, setVoteHistory] = useState<VoteHistoryItem[]>([]);
    const [digitizedDeclarations, setDigitizedDeclarations] = useState<AssetDeclaration[]>([]);
    const [recentSpeeches, setRecentSpeeches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [interpellationCount, setInterpellationCount] = useState<number>(0);

    useEffect(() => {
        const loadMpData = async () => {
            if (!idOrSlug) return;
            try {
                let query = db.from('mps').select('*');
                if (/^\d+$/.test(idOrSlug)) {
                    query = query.eq('id', idOrSlug);
                } else {
                    query = query.eq('slug', idOrSlug);
                }

                const { data: mpData, error: mpError } = await query.single();
                if (mpError) throw mpError;

                const mappedMp: MP = {
                    id: mpData.id,
                    first_name: mpData.name.split(' ')[0],
                    last_name: mpData.name.split(' ').slice(1).join(' '),
                    club: mpData.party,
                    district: mpData.district,
                    photo_url: mpData.photo_url,
                    attendanceRate: Math.round(mpData.stats_attendance || 0),
                    active: mpData.active,
                    rebelVotes: mpData.stats_rebellion || 0,
                    email: '',
                    voivodeship: '',
                    declarations: mpData.declarations || [],
                    term: mpData.term,
                    slug: mpData.slug
                };

                if (/^\d+$/.test(idOrSlug) && mpData.slug) {
                    navigate(`/poslowie/${mpData.slug}`, { replace: true });
                    return;
                }

                setMp(mappedMp);

                // Fetch digitized declarations
                const { data: declData } = await db
                    .from('asset_declarations')
                    .select('*')
                    .eq('mp_id', mpData.id);
                if (declData) setDigitizedDeclarations(declData);

                // Fetch recent speeches
                const { data: speechData } = await db
                    .from('speeches')
                    .select('*')
                    .eq('mp_id', mpData.id)
                    .order('date', { ascending: false })
                    .limit(5);
                if (speechData) setRecentSpeeches(speechData);

                // Fetch Voting History
                const { data: historyData, error: historyError } = await db
                    .from('vote_results')
                    .select('vote, votes!inner(id, sitting, voting_number, title_clean, title_raw, date, verdict, term)')
                    .eq('mp_id', mpData.id)
                    .order('vote_id', { ascending: false })
                    .limit(10);

                if (!historyError && historyData) {
                    setVoteHistory(historyData as unknown as VoteHistoryItem[]);
                }

                // Fetch Interpellation Count
                const { count: interpCount } = await db
                    .from('interpellation_authors')
                    .select('*', { count: 'exact', head: true })
                    .eq('mp_id', mpData.id);
                setInterpellationCount(interpCount || 0);

            } catch (error) {
                console.error('Error fetching MP data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMpData();
    }, [idOrSlug, navigate]);

    return {
        mp,
        voteHistory,
        digitizedDeclarations,
        recentSpeeches,
        loading,
        interpellationCount
    };
}
