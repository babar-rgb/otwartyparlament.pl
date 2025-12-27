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
    isFinal?: boolean;
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
    const [keyVotes, setKeyVotes] = useState<VoteHistoryItem[]>([]);
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
                    first_name: mpData.first_name,
                    last_name: mpData.last_name,
                    club: mpData.club,
                    district: mpData.district,
                    photo_url: mpData.photo_url,
                    attendanceRate: Math.round(mpData.stats_attendance || 0),
                    active: mpData.active,
                    rebelVotes: mpData.stats_rebellion || 0,
                    email: mpData.email || '',
                    contact_info: mpData.contact_info || {},
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
                    .eq('mp_id', mpData.id)
                    .order('year', { ascending: false });
                if (declData) setDigitizedDeclarations(declData);

                // Fetch recent speeches
                const { data: speechData } = await db
                    .from('speeches')
                    .select('*')
                    .eq('mp_id', mpData.id)
                    .order('date', { ascending: false })
                    .limit(5);

                if (speechData) {
                    const cleanedSpeeches = speechData.map(s => {
                        // Clean up speech content - remove metadata headers and whitespace
                        let content = s.content || '';
                        // Remove header noise: "X. kadencja, Y. posiedzenie..."
                        content = content.replace(/\d+\. kadencja,.*?\r\n/g, '');
                        content = content.replace(/.*?punkt porządku dziennego:.*?\r\n/g, '');
                        content = content.replace(/Poseł .*?:.*?\r\n/g, '');
                        // Remove multiple \r\n and trim
                        content = content.replace(/\r\n/g, ' ').replace(/\s+/g, ' ').trim();

                        return { ...s, content };
                    });
                    setRecentSpeeches(cleanedSpeeches);
                }

                // Fetch Voting History
                const { data: historyData, error: historyError } = await db
                    .from('vote_results')
                    .select('result, votes!inner(id, sitting, voting_number, title_clean, title_raw, date, verdict, term, is_final_vote)')
                    .eq('mp_id', mpData.id)
                    .neq('result', 'Nieobecny')
                    .neq('result', 'Absent')
                    .neq('result', 'ABSENT')
                    .order('vote_id', { ascending: false })
                    .limit(10);

                if (historyError) {
                    console.error('[useMpProfile] History error:', historyError);
                }

                if (historyData) {
                    const mappedHistory = (historyData as any[])
                        .map(h => {
                            let normalizedVote = 'ABSENT';
                            const res = h.result?.toUpperCase();

                            if (res === 'ZA' || res === 'YES') normalizedVote = 'YES';
                            else if (res === 'PRZECIW' || res === 'NO') normalizedVote = 'NO';
                            else if (res === 'WSTRZYMAŁ SIĘ' || res === 'ABSTAIN') normalizedVote = 'ABSTAIN';

                            return {
                                vote: normalizedVote,
                                votes: h.votes,
                                isFinal: h.votes.is_final_vote
                            };
                        })
                        .filter(h => h.vote !== 'ABSENT');
                    setVoteHistory(mappedHistory);
                }

                // Fetch Key Votes
                const { data: keyData } = await db
                    .from('vote_results')
                    .select('result, votes!inner(*, is_final_vote)')
                    .eq('mp_id', mpData.id)
                    .neq('result', 'Nieobecny')
                    .neq('result', 'Absent')
                    .or('is_key_vote.eq.true,importance_score.gte.50', { foreignTable: 'votes' })
                    .order('vote_id', { ascending: false })
                    .limit(6);

                if (keyData) {
                    const mappedKey = (keyData as any[])
                        .map(h => {
                            let normalizedVote = 'ABSENT';
                            const res = h.result?.toUpperCase();
                            if (res === 'ZA' || res === 'YES') normalizedVote = 'YES';
                            else if (res === 'PRZECIW' || res === 'NO') normalizedVote = 'NO';
                            else if (res === 'WSTRZYMAŁ SIĘ' || res === 'ABSTAIN') normalizedVote = 'ABSTAIN';
                            return {
                                vote: normalizedVote,
                                votes: h.votes,
                                isFinal: h.votes.is_final_vote
                            };
                        })
                        .filter(h => h.vote !== 'ABSENT');
                    setKeyVotes(mappedKey);
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
        keyVotes,
        digitizedDeclarations,
        recentSpeeches,
        loading,
        interpellationCount
    };
}
