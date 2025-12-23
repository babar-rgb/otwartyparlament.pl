import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, XCircle, PieChart, Users, Sparkles, ThumbsUp, ThumbsDown, Network, ExternalLink } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import VoteTechnicalDetails from '../components/VoteTechnicalDetails';
import SejmHemicycle from '../components/SejmHemicycle';
import OutliersSection from '../components/OutliersSection';
import SEO from '../components/SEO';

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
    const { term, sitting, votingNumber, id } = useParams();
    const [vote, setVote] = useState<VoteDetail | null>(null);
    const [results, setResults] = useState<VoteResult[]>([]);
    const [partyStats, setPartyStats] = useState<Record<string, PartyStats>>({});
    const [loading, setLoading] = useState(true);

    const [analysis, setAnalysis] = useState<{ summary: string; pros: string[]; cons: string[] } | null>(null);
    const [linkedProcessId, setLinkedProcessId] = useState<string | null>(null);
    const [linkedPrint, setLinkedPrint] = useState<{ number: string; title: string } | null>(null);
    const [projectContext, setProjectContext] = useState<{ ai_summary: string; justification_text: string; pdf_url: string } | null>(null);

    useEffect(() => {
        if (id || (sitting && votingNumber)) {
            fetchVoteDetails();
        } else {
            console.warn("Invalid parameters for VoteDetails");
            setLoading(false);
        }
    }, [id, sitting, votingNumber, term]);

    const fetchVoteDetails = async () => {
        setLoading(true);
        const termId = term ? parseInt(term) : 10;
        try {
            // 1. Fetch Vote Metadata
            let query = supabase.from('votes').select('*');

            if (id) {
                query = query.eq('id', id);
            } else {
                query = query
                    .eq('sitting', sitting)
                    .eq('voting_number', votingNumber)
                    .eq('term', termId);
            }

            const { data: voteData, error: voteError } = await query.single();

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

            // 5. Try to link to Law Map (Process) & Project Context
            if (voteData.print_number) {
                // Fetch Process ID
                const { data: procData } = await supabase
                    .from('processes')
                    .select('id')
                    .ilike('print_number', `${voteData.print_number}%`)
                    .limit(1)
                    .maybeSingle();

                if (procData) {
                    setLinkedProcessId(procData.id);
                }

                // Fetch Sejm Print Details
                const { data: printData } = await supabase
                    .from('sejm_prints')
                    .select('number, title')
                    .eq('number', voteData.print_number)
                    .maybeSingle();

                if (printData) {
                    setLinkedPrint(printData);
                }

                // Fetch Bill Insights (Project Context from PDF)
                const { data: insightsData } = await supabase
                    .from('bill_insights')
                    .select('ai_summary, justification_text, pdf_url')
                    .eq('print_number', voteData.print_number)
                    .maybeSingle();

                if (insightsData) {
                    setProjectContext(insightsData);
                }
            }


        } catch (error) {
            console.error('Error fetching vote details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sejm-gold"></div>
        </div>
    );

    if (!vote) return (
        <div>
            <SEO title="Głosowanie nie znalezione" />
            <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
                Głosowanie nie znalezione
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <SEO
                title={cleanSejmTitle(vote.title_clean || vote.title_raw || "Szczegóły Głosowania")}
                description={`Wynik głosowania: ${vote.verdict}. Data: ${new Date(vote.date).toLocaleDateString()}. Zobacz jak głosowali posłowie.`}
            />

            {/* Hero Section - Full Width Dark */}
            <div className="relative bg-slate-900 overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20" />

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

                <div className="relative max-w-6xl mx-auto px-6 py-10">
                    {/* Breadcrumb */}
                    <Link to="/glosowania" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-all mb-8 group text-sm">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Lista głosowań
                    </Link>

                    {/* Kategoria + Data */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        {vote.topic_tag && vote.topic_tag !== 'Inne' && (
                            <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {vote.topic_tag}
                            </span>
                        )}
                        <span className="text-slate-400 text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(vote.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        <span className="text-slate-500 text-sm">
                            Posiedzenie {vote.sitting} · Głosowanie nr {vote.voting_number}
                        </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-snug mb-8 max-w-4xl">
                        {cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                    </h1>

                    {/* Law Map CTA */}
                    {linkedProcessId && (
                        <Link
                            to={`/mapa/${linkedProcessId}`}
                            className="inline-flex items-center gap-3 px-6 py-4 mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-900/40 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all group border border-white/10"
                        >
                            <div className="p-2 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                                <Network size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Wizualizacja</div>
                                <div className="text-lg leading-none">Zobacz Mapę Myśli Ustawy</div>
                            </div>
                            <ArrowRight className="ml-2 opacity-80 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    )}

                    {/* Linked Print Card */}
                    {linkedPrint && (
                        <div className="mb-8 bg-white/10 backdrop-blur border border-white/20 p-5 rounded-xl flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                                    <ExternalLink size={24} />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                                        Powiązany Druk Sejmowy nr {linkedPrint.number}
                                    </div>
                                    <h3 className="text-white font-semibold text-lg leading-tight mb-2">
                                        {linkedPrint.title}
                                    </h3>
                                    {/* Source heuristic */}
                                    <div className="flex gap-2 mb-3">
                                        {linkedPrint.title.toLowerCase().includes('rządowy') && <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-500/50">Rządowy</span>}
                                        {linkedPrint.title.toLowerCase().includes('poselski') && <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded border border-purple-500/50">Poselski</span>}
                                        {linkedPrint.title.toLowerCase().includes('senacki') && <span className="text-[10px] bg-orange-500/30 text-orange-200 px-2 py-0.5 rounded border border-orange-500/50">Senacki</span>}
                                        {linkedPrint.title.toLowerCase().includes('obywatelski') && <span className="text-[10px] bg-green-500/30 text-green-200 px-2 py-0.5 rounded border border-green-500/50">Obywatelski</span>}
                                    </div>

                                    <a
                                        href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${linkedPrint.number}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm text-blue-300 hover:text-white underline decoration-blue-300/50 hover:decoration-white transition-colors"
                                    >
                                        Otwórz tekst źródłowy na stronie Sejmu →
                                    </a>
                                </div>
                            </div>

                            {/* Project Scanner Context - Nested inside the print card */}
                            {projectContext && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                            <Sparkles size={12} />
                                            Kontekst z PDF
                                        </div>
                                    </div>
                                    <div className="text-slate-300 text-sm leading-relaxed mb-3 italic">
                                        "{projectContext.ai_summary}"
                                    </div>
                                    {projectContext.pdf_url && (
                                        <a href={projectContext.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
                                            Zobacz pełny PDF <ExternalLink size={10} />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vote Result Card */}
                    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
                        {/* Verdict + Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Verdict Badge */}
                            <div className={`shrink-0 inline-flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-lg ${vote.verdict === 'PRZYJĘTO'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                {vote.verdict === 'PRZYJĘTO' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                {vote.verdict}
                            </div>

                            {/* Vote Progress Bar */}
                            <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2 text-sm">
                                    <span className="font-bold text-emerald-400">ZA: {vote.details_json?.yes || 0}</span>
                                    <span className="font-bold text-red-400">PRZECIW: {vote.details_json?.no || 0}</span>
                                </div>
                                <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
                                    <div
                                        className="bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
                                        style={{ width: `${((vote.details_json?.yes || 0) / ((vote.details_json?.yes || 0) + (vote.details_json?.no || 1))) * 100}%` }}
                                    />
                                    <div
                                        className="bg-gradient-to-r from-red-500 to-red-400"
                                        style={{ width: `${((vote.details_json?.no || 0) / ((vote.details_json?.yes || 0) + (vote.details_json?.no || 1))) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-700/50">
                            <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                                <div className="text-2xl font-bold text-emerald-400">{vote.details_json?.yes || 0}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Za</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-red-500/10">
                                <div className="text-2xl font-bold text-red-400">{vote.details_json?.no || 0}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Przeciw</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-amber-500/10">
                                <div className="text-2xl font-bold text-amber-400">{vote.details_json?.abstain || 0}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Wstrzymało się</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-slate-500/10">
                                <div className="text-2xl font-bold text-slate-400">{460 - (vote.details_json?.yes || 0) - (vote.details_json?.no || 0) - (vote.details_json?.abstain || 0)}</div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Nieobecni</div>
                            </div>
                        </div>
                    </div>

                    <VoteTechnicalDetails rawTitle={vote.title_raw || vote.title_clean} />
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-6xl mx-auto px-6 py-10">
                <div className="space-y-10">

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

            {/* Outliers (Rebels) Section */}
            <OutliersSection results={results} partyStats={partyStats} />

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
    );
};

export default VoteDetails;
