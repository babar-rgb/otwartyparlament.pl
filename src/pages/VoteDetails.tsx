import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, XCircle, PieChart, Users, Sparkles, Network, ExternalLink, Search, FileText, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import SocialShareCard from '../components/SocialShareCard';
import { cleanSejmTitle } from '../utils/titleFormatter';
import VoteTechnicalDetails from '../components/VoteTechnicalDetails';
import SejmHemicycle from '../components/SejmHemicycle';
import OutliersSection from '../components/OutliersSection';
import SEO from '../components/SEO';
import VoteMindMap from '../components/VoteMindMap';
import { useVoteDetails } from '../hooks/useVoteDetails';

const VoteDetails: React.FC = () => {
    const { term, sitting, votingNumber, id } = useParams();
    const {
        vote,
        results,
        partyStats,
        loading,
        analysis,
        linkedProcessId,
        linkedPrint,
        projectContext
    } = useVoteDetails(id, sitting, votingNumber, term);

    const [mpSearch, setMpSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadImage = async () => {
        const node = document.getElementById('social-share-card');
        if (!node) return;

        setIsGenerating(true);
        try {
            // Wait a bit for fonts to potentially load/stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            const dataUrl = await toPng(node, {
                quality: 1,
                pixelRatio: 2, // High resolution
                skipAutoScale: true
            });

            const link = document.createElement('a');
            link.download = `OtwartyParlament_Glosowanie_${vote?.voting_number || 'export'}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Error generating image:', error);
        } finally {
            setIsGenerating(false);
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
            <div className="relative bg-slate-50 dark:bg-slate-950 overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20" />

                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

                <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-10">
                    {/* Breadcrumb */}
                    <Link to="/glosowania" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-all mb-8 group text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Głosowania
                    </Link>

                    {/* Kategoria + Data */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        {vote.topic_tag && vote.topic_tag !== 'Inne' && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                    #{vote.topic_tag}
                                </span>
                                {(vote.importance_score ?? 0) > 60 && (
                                    <Sparkles className="w-3 h-3 text-fuchsia-400 opacity-60" />
                                )}
                                <span className="text-slate-700 dark:text-slate-700">|</span>
                            </div>
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

                    <div className="flex flex-wrap gap-4 mb-8">
                        {/* Download Graphics Button */}
                        <button
                            onClick={handleDownloadImage}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${isGenerating
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 hover:scale-[1.02] active:scale-95'
                                }`}
                        >
                            {isGenerating ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Share2 className="w-4 h-4" />
                            )}
                            {isGenerating ? 'Generowanie...' : 'Pobierz Grafikę (Instagram/X)'}
                        </button>
                    </div>

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

                    {/* Linked Print Card - Polished & Prominent */}
                    {linkedPrint && (
                        <div className="mb-10 bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                            {/* Accent blur */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />

                            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                                <div className="p-4 bg-amber-500/20 text-amber-300 rounded-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500">
                                    <FileText size={40} strokeWidth={1.5} />
                                </div>
                                <div className="flex-grow space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                            Druk Sejmowy {linkedPrint.number}
                                        </span>
                                        <div className="h-px bg-white/10 flex-grow" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                                        {linkedPrint.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
                                        {linkedPrint.title.toLowerCase().includes('rządowy') && <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-md border border-blue-500/30">Projekt Rządowy</span>}
                                        {linkedPrint.title.toLowerCase().includes('poselski') && <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-md border border-purple-500/30">Projekt Poselski</span>}
                                        {linkedPrint.title.toLowerCase().includes('senacki') && <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-md border border-orange-500/30">Projekt Senacki</span>}
                                        {linkedPrint.title.toLowerCase().includes('obywatelski') && <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-md border border-emerald-500/30">Projekt Obywatelski</span>}
                                    </div>

                                    <div className="pt-4 flex flex-wrap items-center gap-6">
                                        <a
                                            href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${linkedPrint.number}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-sm font-bold text-amber-400 hover:text-white transition-colors group/link"
                                        >
                                            Tekst źródłowy RP <ExternalLink size={14} className="group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                        </a>
                                        {projectContext?.pdf_url && (
                                            <a
                                                href={projectContext.pdf_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-white transition-colors group/link"
                                            >
                                                Pełny Dokument (PDF) <FileText size={14} className="group-hover/link:scale-110 transition-transform" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* AI Context Snippet if available */}
                            {projectContext?.ai_summary && (
                                <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 italic">
                                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                        <Sparkles size={12} />
                                        Streszczenie AI
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        "{projectContext.ai_summary}"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vote Result Card */}
                    <div className="bg-white dark:bg-[#111126] rounded-[2rem] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
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
                </div>
            </div>

            {/* AI Analysis Section */}
            {analysis && (
                <div className="space-y-8">
                    {/* Mind Map Visualization */}
                    <VoteMindMap
                        title={cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                        summary={analysis.summary}
                        pros={analysis.pros || []}
                        cons={analysis.cons || []}
                    />
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

                <div className="bg-slate-900/50 rounded-2xl overflow-hidden shadow-sm border border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/50 text-sm uppercase tracking-wider text-slate-400">
                                    <th className="p-4 font-semibold">Klub / Koło</th>
                                    <th className="p-4 font-semibold text-green-400">Za</th>
                                    <th className="p-4 font-semibold text-red-400">Przeciw</th>
                                    <th className="p-4 font-semibold text-slate-400">Wstrzymał się</th>
                                    <th className="p-4 font-semibold text-slate-500">Nieobecny</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {Object.entries(partyStats).map(([party, stats]) => (
                                    <tr key={party} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-medium text-white">{party}</td>
                                        <td className="p-4 font-bold text-green-400">{stats.yes}</td>
                                        <td className="p-4 font-bold text-red-400">{stats.no}</td>
                                        <td className="p-4 font-bold text-slate-400">{stats.abstain}</td>
                                        <td className="p-4 text-slate-500">{stats.absent}</td>
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
            <div className="space-y-4 pt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold">Wyniki Indywidualne</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Szukaj posła..."
                            value={mpSearch}
                            onChange={(e) => setMpSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-600 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-full sm:w-64 bg-slate-800 text-white placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results
                        .filter(r => !mpSearch || r.mps?.name?.toLowerCase().includes(mpSearch.toLowerCase()) || r.mps?.party?.toLowerCase().includes(mpSearch.toLowerCase()))
                        .map((r, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-base transition-colors hover:border-indigo-500/50">
                                <div className={`w-2 h-10 rounded-full ${r.vote === 'YES' ? 'bg-emerald-500' :
                                    r.vote === 'NO' ? 'bg-red-500' :
                                        r.vote === 'ABSTAIN' ? 'bg-amber-500' : 'bg-slate-500'
                                    }`} />
                                <div>
                                    <div className="font-bold text-sm text-primary">{r.mps?.name}</div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-secondary">{r.mps?.party}</div>
                                </div>
                                <div className="ml-auto text-xs font-black">
                                    {r.vote === 'YES' && <span className="text-emerald-500">ZA</span>}
                                    {r.vote === 'NO' && <span className="text-red-500">PRZECIW</span>}
                                    {r.vote === 'ABSTAIN' && <span className="text-amber-500">WSTRZ.</span>}
                                    {r.vote === 'ABSENT' && <span className="text-secondary opacity-50">NIEOB.</span>}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
            {/* Hidden capture target for Social Media Graphics */}
            <div
                className="fixed left-[-2000px] top-[-2000px] pointer-events-none"
                aria-hidden="true"
            >
                <SocialShareCard
                    title={cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                    verdict={vote.verdict as 'PRZYJĘTO' | 'ODRZUCONO'}
                    date={new Date(vote.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    stats={{
                        yes: vote.details_json?.yes || 0,
                        no: vote.details_json?.no || 0,
                        abstain: vote.details_json?.abstain || 0
                    }}
                    topicTag={vote.topic_tag}
                />
            </div>
        </div>
    );
};

export default VoteDetails;
