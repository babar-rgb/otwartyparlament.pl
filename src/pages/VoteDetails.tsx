import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, PieChart, Users } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import VoteTechnicalDetails from '../components/VoteTechnicalDetails';

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
}

interface VoteResult {
    vote: string;
    mps: {
        name: string;
        party: string;
        photo_url: string;
    };
}

interface PartyStats {
    yes: number;
    no: number;
    abstain: number;
    absent: number;
}

const VoteDetails: React.FC = () => {
    const { sitting, votingNumber } = useParams();
    const [vote, setVote] = useState<VoteDetail | null>(null);
    const [results, setResults] = useState<VoteResult[]>([]);
    const [partyStats, setPartyStats] = useState<Record<string, PartyStats>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sitting && votingNumber) {
            fetchVoteDetails();
        }
    }, [sitting, votingNumber]);

    const fetchVoteDetails = async () => {
        setLoading(true);
        try {
            // 1. Fetch Vote Metadata
            const { data: voteData, error: voteError } = await supabase
                .from('votes')
                .select('*')
                .eq('sitting', sitting)
                .eq('voting_number', votingNumber)
                .single();

            if (voteError) throw voteError;
            setVote(voteData);

            // 2. Fetch Individual Results with MP info
            const { data: resultsData, error: resultsError } = await supabase
                .from('vote_results')
                .select('vote, mps(name, party, photo_url)')
                .eq('vote_id', voteData.id);

            if (resultsError) throw resultsError;

            const typedResults = resultsData as unknown as VoteResult[];
            setResults(typedResults);

            // 3. Calculate Party Stats
            const stats: Record<string, PartyStats> = {};

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
                    </div>
                </div>

                {/* Party Breakdown Table */}
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
