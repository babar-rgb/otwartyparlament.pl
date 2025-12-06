import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, PieChart, Users, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import VoteTechnicalDetails from '../components/VoteTechnicalDetails';
import SejmHemicycle from '../components/SejmHemicycle';

interface VoteDetail {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    title_raw?: string;
    verdict: string;
    print_number: string | null;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
        notParticipating: number;
    };
    importance_score?: number;
    topic_tag?: string;
    semantic_weight?: number;
}

interface VoteResult {
    vote: string;
    mps: {
        name: string;
        party: string;
        photo_url: string;
        slug: string;
        id: number;
    };
}

interface PartyStats {
    yes: number;
    no: number;
    abstain: number;
    absent: number;
}

const VoteDetails: React.FC = () => {
    const { term, sitting, votingNumber } = useParams();
    const [vote, setVote] = useState<VoteDetail | null>(null);
    const [results, setResults] = useState<VoteResult[]>([]);
    const [partyStats, setPartyStats] = useState<Record<string, PartyStats>>({});
    const [loading, setLoading] = useState(true);

    const [analysis, setAnalysis] = useState<{ summary: string; pros: string[]; cons: string[] } | null>(null);

    useEffect(() => {
        if (sitting && votingNumber) {
            fetchVoteDetails();
        }
    }, [sitting, votingNumber, term]);

    const fetchVoteDetails = async () => {
        setLoading(true);
        const termId = term ? parseInt(term) : 10;
        try {
            // 1. Fetch Vote Metadata
            const { data: voteData, error: voteError } = await supabase
                .from('votes')
                .select('*')
                .eq('sitting', sitting)
                .eq('voting_number', votingNumber)
                .eq('term', termId)
                .single();

            if (voteError) throw voteError;
            setVote(voteData);

            // 2. Fetch Individual Results (Get MP IDs first)
            const { data: resultsDataRaw, error: resultsError } = await supabase
                .from('vote_results')
                .select('vote, mp_id')
                .eq('vote_id', voteData.id)
                .limit(460);

            if (resultsError) throw resultsError;

            // 3. Fetch MPs efficiently
            const mpIds = resultsDataRaw.map((r: any) => r.mp_id);
            const { data: mpsData, error: mpsError } = await supabase
                .from('mps')

                .select('id, name, party, photo_url, seat_number, slug')
                .in('id', mpIds);

            if (mpsError) throw mpsError;

            // 4. Manual Join
            const mpMap = new Map(mpsData?.map((mp: any) => [mp.id, mp]));
            const typedResults: VoteResult[] = resultsDataRaw.map((r: any) => ({
                vote: r.vote,
                mps: mpMap.get(r.mp_id)
            }));

            setResults(typedResults);

            // 5. Calculate Party Stats
            const stats: Record<string, { yes: number; no: number; abstain: number; absent: number }> = {};

            typedResults.forEach(r => {
                const party = r.mps?.party || 'Niezrzeszeni';
                if (!stats[party]) {
                    stats[party] = { yes: 0, no: 0, abstain: 0, absent: 0 };
                }

                if (r.vote === 'YES') stats[party].yes++;
                else if (r.vote === 'NO') stats[party].no++;
                else if (r.vote === 'ABSTAIN') stats[party].abstain++;
                else stats[party].absent++;
            });

            setPartyStats(stats);

            // 4. Fetch AI Analysis
            const { data: analysisData, error: analysisError } = await supabase
                .from('vote_analyses')
                .select('summary, pros, cons')
                .eq('vote_id', voteData.id)
                .single();

            if (!analysisError && analysisData) {
                setAnalysis(analysisData);
            }

        } catch (error) {
            console.error('Error fetching vote details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center">Ładowanie szczegółów...</div>;
    if (!vote) return <div className="p-12 text-center">Nie znaleziono głosowania.</div>;

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Back Link */}
                <Link to="/glosowania" className="inline-flex items-center gap-2 text-neutral-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do listy głosowań
                </Link>

                {/* Header */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-neutral-200">
                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                            <span className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-full">
                                <Calendar className="w-4 h-4" />
                                {new Date(vote.date).toLocaleDateString('pl-PL')}
                            </span>
                            <span className="bg-neutral-100 px-3 py-1 rounded-full">
                                Posiedzenie {vote.sitting}, Głosowanie {vote.voting_number}
                            </span>
                        </div>

                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2">
                                {cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                            </h1>

                            <VoteTechnicalDetails rawTitle={vote.title_raw || vote.title_clean} />
                        </div>

                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-xl text-lg font-bold ${vote.verdict === 'PRZYJĘTO'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {vote.verdict === 'PRZYJĘTO' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            {vote.verdict}
                        </div>

                        {/* AI Intelligence Badge */}
                        {vote.importance_score && (
                            <div className="flex flex-wrap gap-4 mt-4">
                                <div className="flex items-center gap-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-4 py-2 rounded-xl shadow-md">
                                    <Sparkles className="w-5 h-5" />
                                    <div>
                                        <div className="text-xs font-medium opacity-90 uppercase tracking-wider">Importance Score</div>
                                        <div className="text-xl font-bold">{vote.importance_score}/100</div>
                                    </div>
                                </div>

                                {vote.topic_tag && (
                                    <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl border border-slate-200">
                                        <span className="text-sm font-bold">#{vote.topic_tag}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Analysis Section */}
                {analysis && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#0f0c29] dark:via-[#302b63] dark:to-[#24243e] rounded-3xl p-8 shadow-lg border border-indigo-100 dark:border-indigo-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-20">
                            <Sparkles className="w-32 h-32 text-indigo-600 dark:text-purple-400" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-indigo-500/20 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-300">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">Analiza AI</h2>
                            </div>

                            <div className="bg-white/60 dark:bg-indigo-950/40 backdrop-blur-md rounded-xl p-6 border border-indigo-100 dark:border-indigo-500/30 shadow-sm">
                                <p className="text-lg text-indigo-900 dark:text-indigo-100 leading-relaxed font-medium">
                                    {analysis.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Pros */}
                                <div className="bg-white/60 dark:bg-emerald-950/20 backdrop-blur-md rounded-xl p-6 border border-green-100 dark:border-emerald-500/20">
                                    <h3 className="font-bold text-green-800 dark:text-emerald-400 mb-4 flex items-center gap-2">
                                        <ThumbsUp className="w-5 h-5" />
                                        Argumenty ZA
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.pros?.map((pro, i) => (
                                            <li key={i} className="flex gap-3 text-green-900 dark:text-emerald-100">
                                                <span className="text-green-500 dark:text-emerald-400 font-bold shrink-0">•</span>
                                                <span className="opacity-90">{pro}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Cons */}
                                <div className="bg-white/60 dark:bg-rose-950/20 backdrop-blur-md rounded-xl p-6 border border-red-100 dark:border-rose-500/20">
                                    <h3 className="font-bold text-red-800 dark:text-rose-400 mb-4 flex items-center gap-2">
                                        <ThumbsDown className="w-5 h-5" />
                                        Argumenty PRZECIW
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.cons?.map((con, i) => (
                                            <li key={i} className="flex gap-3 text-red-900 dark:text-rose-100">
                                                <span className="text-red-500 dark:text-rose-400 font-bold shrink-0">•</span>
                                                <span className="opacity-90">{con}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="text-xs text-indigo-400 dark:text-indigo-300/60 text-center pt-2">
                                Analiza wygenerowana automatycznie przez model sztucznej inteligencji. Może zawierać uproszczenia.
                            </div>
                        </div>
                    </div>
                )}

                {/* Sejm Hemicycle Visualization */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold">Sala Sejmowa</h2>
                    </div>
                    <div className="bg-white dark:bg-[#1a1f36] rounded-3xl p-4 md:p-8 shadow-sm border border-neutral-200 dark:border-slate-800">
                        <SejmHemicycle
                            data={results.map(r => ({
                                name: r.mps?.name || 'Nieznany',
                                party: r.mps?.party || 'Niezrzeszeni',
                                photo_url: r.mps?.photo_url || '',
                                vote: r.vote,
                                id: r.mps?.id,
                                seat_number: undefined,
                                slug: r.mps?.slug
                            }))}
                        />
                        <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-600"></span> ZA</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600"></span> PRZECIW</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> WSTRZYMAŁ SIĘ</div>
                            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-neutral-300"></span> NIEOBECNY</div>
                        </div>
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <PieChart className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold">Głosowanie w Klubach</h2>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 text-sm uppercase tracking-wider text-neutral-500">
                                        <th className="p-4 font-semibold">Klub / Koło</th>
                                        <th className="p-4 font-semibold text-green-600">Za</th>
                                        <th className="p-4 font-semibold text-red-600">Przeciw</th>
                                        <th className="p-4 font-semibold text-neutral-600">Wstrzymał się</th>
                                        <th className="p-4 font-semibold text-neutral-400">Nieobecny</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {Object.entries(partyStats).map(([party, stats]) => (
                                        <tr key={party} className="hover:bg-neutral-50 transition-colors">
                                            <td className="p-4 font-medium">{party}</td>
                                            <td className="p-4 font-bold text-green-600">{stats.yes}</td>
                                            <td className="p-4 font-bold text-red-600">{stats.no}</td>
                                            <td className="p-4 font-bold text-neutral-600">{stats.abstain}</td>
                                            <td className="p-4 text-neutral-400">{stats.absent}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Individual Votes (Optional / Collapsible could be better but listing all for now as requested) */}
                {/* For performance, maybe just show a summary or search? 
            User asked for "wiedziec jak kazdy posel zaglosowal". 
            Listing 460 rows is a bit much but acceptable for a details page. 
        */}
                <div className="space-y-4 pt-8">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold">Wyniki Indywidualne</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((r, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-100">
                                <div className={`w-2 h-10 rounded-full ${r.vote === 'YES' ? 'bg-green-500' :
                                    r.vote === 'NO' ? 'bg-red-500' :
                                        r.vote === 'ABSTAIN' ? 'bg-neutral-400' : 'bg-neutral-200'
                                    }`} />
                                <div>
                                    <div className="font-medium text-sm">{r.mps?.name}</div>
                                    <div className="text-xs text-neutral-500">{r.mps?.party}</div>
                                </div>
                                <div className="ml-auto text-sm font-bold">
                                    {r.vote === 'YES' && <span className="text-green-600">ZA</span>}
                                    {r.vote === 'NO' && <span className="text-red-600">PRZECIW</span>}
                                    {r.vote === 'ABSTAIN' && <span className="text-neutral-500">WSTRZ.</span>}
                                    {r.vote === 'ABSENT' && <span className="text-neutral-300">NIEOB.</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VoteDetails;
