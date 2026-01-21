import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, PieChart, Users, Sparkles, ExternalLink, Search, FileText, Share2 } from 'lucide-react';

import SocialShareCard from '../components/SocialShareCard';
import { cleanSejmTitle } from '../utils/titleFormatter';
import VoteTechnicalDetails from '../components/VoteTechnicalDetails';
import SejmHemicycle from '../components/features/sejm/SejmHemicycle';
import OutliersSection from '../components/features/analysis/OutliersSection';
import SEO from '../components/SEO';
import VoteMindMap from '../components/features/analysis/VoteMindMap';

import { useVoteDetails } from '../hooks/useVoteDetails';
import DataPendingState from '../components/DataPendingState';
import { formatPolishDate } from '../utils/dateUtils';
import VoteConnections from '../components/VoteConnections';

const VoteDetails: React.FC = () => {
    const { term, sitting, votingNumber, id } = useParams();
    const {
        vote,
        results,
        partyStats,
        loading,
        analysis,
        linkedPrint,
        projectContext,
        generateAnalysis
    } = useVoteDetails(id, sitting, votingNumber, term);

    const [mpSearch, setMpSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadImage = async () => {
        const node = document.getElementById('social-share-card');
        if (!node) return;

        setIsGenerating(true);
        try {
            // Dynamic import for performance
            const { toPng } = await import('html-to-image');

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
        <div className="min-h-screen bg-page flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin"></div>
        </div>
    );

    if (!vote) return (
        <div>
            <SEO title="Głosowanie nie znalezione" />
            <div className="min-h-screen bg-page flex items-center justify-center text-secondary">
                Głosowanie nie znalezione
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-page text-primary">
            <SEO
                title={cleanSejmTitle(vote.title_clean || vote.title_raw || "Szczegóły Głosowania")}
                description={`Wynik: ${vote.verdict}. ${vote.for || 0} za, ${vote.against || 0} przeciw. Posiedzenie ${vote.sitting}, głosowanie ${vote.voting_number}. Data: ${formatPolishDate(vote.date)}.`}
                url={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
            />

            {/* Hero Section - Full Width Dark */}
            <div className="relative bg-page overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 via-transparent to-purple-500/5" />

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
                                <span className="text-secondary/30">|</span>
                            </div>
                        )}
                        <span className="text-secondary text-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatPolishDate(vote.date)}
                        </span>
                        <span className="text-secondary opacity-60 text-sm">
                            Posiedzenie {vote.sitting} · Głosowanie nr {vote.voting_number}
                        </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary leading-snug mb-8 max-w-4xl tracking-tight">
                        {cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                    </h1>

                    {/* Smart Actions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                        {/* 1. Share/Download Card */}
                        <div className="bg-surface p-6 rounded-2xl border border-border-base hover:border-blue-500/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden" onClick={handleDownloadImage}>
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Share2 size={64} />
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                                    {isGenerating ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <Share2 size={20} />}
                                </div>
                                <div>
                                    <div className="font-bold text-primary">Udostępnij Grafikę</div>
                                    <div className="text-xs text-secondary">Generuj obraz na Instagram/X</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Connections Card */}
                        <VoteConnections
                            voteId={vote.id}
                            voteTitle={cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                            variant="card"
                        />
                    </div>

                    {/* Source Links (De-emphasized) */}
                    <div className="flex flex-wrap gap-6 mb-8 text-xs font-bold text-secondary uppercase tracking-wider">
                        {linkedPrint && (
                            <a href={`https://www.sejm.gov.pl/Sejm10.nsf/druk.xsp?nr=${linkedPrint.number}`} target="_blank" rel="noreferrer" className="hover:text-amber-600 transition-colors flex items-center gap-2">
                                <ExternalLink size={12} /> Tekst Źródłowy RP
                            </a>
                        )}
                        {projectContext?.pdf_url && (
                            <a href={projectContext.pdf_url} target="_blank" rel="noreferrer" className="hover:text-emerald-600 transition-colors flex items-center gap-2">
                                <FileText size={12} /> Pełny Dokument PDF
                            </a>
                        )}
                        <a
                            href={`https://www.sejm.gov.pl/Sejm${vote.term}.nsf/agent.xsp?symbol=glosowania&NrKadencji=${vote.term}&NrPosiedzenia=${vote.sitting}&NrGlosowania=${vote.voting_number}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-blue-500 transition-colors flex items-center gap-2"
                        >
                            <ExternalLink size={12} /> Źródło (Sejm.gov.pl)
                        </a>
                    </div>

                    {/* Linked Print Card - Polished & Prominent */}
                    {linkedPrint && (
                        <div className="mb-10 bg-surface backdrop-blur-xl border border-border-base p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                            {/* Accent blur */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />

                            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                                <div className="p-4 bg-amber-500/20 text-amber-600 rounded-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500">
                                    <FileText size={40} strokeWidth={1.5} />
                                </div>
                                <div className="flex-grow space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                                            Druk Sejmowy {linkedPrint.number}
                                        </span>
                                        <div className="h-px bg-border-base flex-grow" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black text-primary leading-tight">
                                        {linkedPrint.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                                        {linkedPrint.title.toLowerCase().includes('rządowy') && <span className="bg-blue-500/10 text-blue-600 px-3 py-1 rounded-md border border-blue-500/20">Projekt Rządowy</span>}
                                        {linkedPrint.title.toLowerCase().includes('poselski') && <span className="bg-purple-500/10 text-purple-600 px-3 py-1 rounded-md border border-purple-500/20">Projekt Poselski</span>}
                                        {linkedPrint.title.toLowerCase().includes('senacki') && <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-md border border-orange-500/20">Projekt Senacki</span>}
                                        {linkedPrint.title.toLowerCase().includes('obywatelski') && <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-md border border-emerald-500/20">Projekt Obywatelski</span>}
                                    </div>
                                </div>
                            </div>

                            {/* AI Context Snippet if available */}
                            {projectContext?.ai_summary && (
                                <div className="mt-8 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-border-base italic">
                                    <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                        <Sparkles size={12} />
                                        Streszczenie AI
                                    </div>
                                    <p className="text-secondary text-sm leading-relaxed">
                                        "{projectContext.ai_summary}"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vote Result Card */}
                    <div className="bg-surface rounded-3xl p-8 border border-border-base shadow-sm">
                        {/* Verdict + Bar */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Verdict Badge */}
                            <div className={`shrink-0 inline-flex items-center gap-3 px-5 py-3 rounded-xl font-black text-lg ${vote.verdict === 'PRZYJĘTO'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                }`}>
                                {vote.verdict === 'PRZYJĘTO' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                {vote.verdict}
                            </div>


                            {/* Vote Progress Bar */}
                            <div className="flex-grow">
                                <div className="flex items-center justify-between mb-2 text-xs font-black uppercase tracking-widest">
                                    <span className="text-emerald-600">ZA: {vote.details_json?.yes || 0}</span>
                                    <span className="text-rose-600">PRZECIW: {vote.details_json?.no || 0}</span>
                                </div>
                                <div className="h-4 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden flex border border-border-base">
                                    <div
                                        className="bg-emerald-500 transition-all duration-1000 ease-out"
                                        style={{ width: `${((vote.details_json?.yes || 0) / ((vote.details_json?.yes || 0) + (vote.details_json?.no || 1))) * 100}%` }}
                                    />
                                    <div
                                        className="bg-rose-500"
                                        style={{ width: `${((vote.details_json?.no || 0) / ((vote.details_json?.yes || 0) + (vote.details_json?.no || 1))) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-base">
                            <div className="text-center p-3 rounded-xl bg-emerald-500/10">
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{vote.details_json?.yes || 0}</div>
                                <div className="text-[10px] text-secondary uppercase tracking-widest font-black mt-1">Za</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-rose-500/10">
                                <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{vote.details_json?.no || 0}</div>
                                <div className="text-[10px] text-secondary uppercase tracking-widest font-black mt-1">Przeciw</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-amber-500/10">
                                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{vote.details_json?.abstain || 0}</div>
                                <div className="text-[10px] text-secondary uppercase tracking-widest font-black mt-1">Wstrzymało się</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border-base/50">
                                <div className="text-2xl font-black text-secondary">{460 - (vote.details_json?.yes || 0) - (vote.details_json?.no || 0) - (vote.details_json?.abstain || 0)}</div>
                                <div className="text-[10px] text-secondary uppercase tracking-widest font-black mt-1">Nieobecni</div>
                            </div>
                        </div>
                    </div>

                    <VoteTechnicalDetails rawTitle={(vote.title_raw || vote.title_clean || '') as string} />
                </div>
            </div>

            {/* AI Analysis Section */}
            {analysis ? (
                <div className="max-w-6xl mx-auto px-6 py-10">


                    {/* Mind Map Visualization */}
                    <div className="mt-8">
                        <VoteMindMap
                            title={cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                            summary={analysis.summary}
                            pros={analysis.pros || []}
                            cons={analysis.cons || []}
                            voteId={vote.id}
                            procedural_context={analysis.procedural_context}
                        />
                    </div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto px-6 py-10">
                    <div className="bg-surface rounded-3xl p-8 border border-border-base shadow-sm text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <Sparkles size={120} />
                        </div>
                        <Sparkles className="w-12 h-12 text-accent-blue mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-primary mb-2">Analiza AI (Beta)</h3>
                        <p className="text-secondary mb-6 max-w-lg mx-auto">
                            Wygeneruj natychmiastowe podsumowanie i analizę tego głosowania przy użyciu lokalnego modelu językowego.
                        </p>
                        <button
                            onClick={generateAnalysis}
                            className="bg-accent-blue hover:bg-accent-blue/90 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 mx-auto relative z-10 shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <Sparkles size={18} />
                            Generuj Analizę
                        </button>
                    </div>
                </div>
            )}

            {results.length > 0 ? (
                <>
                    {/* Sejm Hemicycle Visualization */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Users className="w-6 h-6 text-accent-blue" />
                            <h2 className="text-2xl font-black tracking-tight">Sala Sejmowa</h2>
                        </div>
                        <div className="bg-surface rounded-3xl p-4 md:p-8 shadow-sm border border-border-base relative overflow-hidden">
                            <div className="absolute inset-0 bg-accent-blue/5 pointer-events-none" />
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
                            <div className="flex flex-wrap justify-center gap-6 mt-6 text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">
                                <div className="flex items-center gap-2 relative z-10"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ZA</div>
                                <div className="flex items-center gap-2 relative z-10"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> PRZECIW</div>
                                <div className="flex items-center gap-2 relative z-10"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> WSTRZYMAŁ SIĘ</div>
                                <div className="flex items-center gap-2 relative z-10"><span className="w-2.5 h-2.5 rounded-full bg-secondary"></span> NIEOBECNY</div>
                            </div>
                        </div>
                    </div>

                    {/* Party Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <PieChart className="w-6 h-6 text-accent-blue" />
                            <h2 className="text-2xl font-black tracking-tight">Głosowanie w Klubach</h2>
                        </div>

                        <div className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border-base">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/5 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-secondary opacity-60">
                                            <th className="p-4">Klub / Koło</th>
                                            <th className="p-4 text-emerald-600">Za</th>
                                            <th className="p-4 text-rose-600">Przeciw</th>
                                            <th className="p-4">Wstrzymał się</th>
                                            <th className="p-4">Nieobecny</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-base">
                                        {Object.entries(partyStats).map(([party, stats]) => (
                                            <tr key={party} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-black text-primary">{party}</td>
                                                <td className="p-4 font-black text-emerald-600">{stats.yes}</td>
                                                <td className="p-4 font-black text-rose-600">{stats.no}</td>
                                                <td className="p-4 font-black text-primary">{stats.abstain}</td>
                                                <td className="p-4 text-secondary opacity-40 font-black">{stats.absent}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Outliers (Rebels) Section */}
                    <OutliersSection results={results} partyStats={partyStats} />

                    {/* Individual Votes */}
                    <div className="space-y-4 pt-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-6 h-6 text-accent-blue" />
                                <h2 className="text-2xl font-black tracking-tight">Wyniki Indywidualne</h2>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-30 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Szukaj posła..."
                                    value={mpSearch}
                                    onChange={(e) => setMpSearch(e.target.value)}
                                    className="pl-10 pr-4 py-3 border border-border-base rounded-2xl text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue w-full sm:w-64 bg-surface text-primary placeholder:text-secondary opacity-80"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results
                                .filter(r => !mpSearch || r.mps.name.toLowerCase().includes(mpSearch.toLowerCase()) || r.mps.party.toLowerCase().includes(mpSearch.toLowerCase()))
                                .map((r, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border-base transition-colors hover:border-accent-blue shadow-sm">
                                        <div className={`w-2 h-10 rounded-full ${r.vote === 'YES' ? 'bg-emerald-500' :
                                            r.vote === 'NO' ? 'bg-rose-500' :
                                                r.vote === 'ABSTAIN' ? 'bg-amber-500' : 'bg-secondary opacity-20'
                                            }`} />
                                        <div>
                                            <div className="font-bold text-sm text-primary">{r.mps.name}</div>
                                            <div className="text-[10px] font-black uppercase tracking-wider text-secondary">{r.mps.party}</div>
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
                </>
            ) : (
                <div className="max-w-2xl mx-auto py-10">
                    <DataPendingState />
                </div>
            )}
            {/* Hidden capture target for Social Media Graphics */}
            <div
                className="fixed left-[-2000px] top-[-2000px] pointer-events-none"
                aria-hidden="true"
            >
                <SocialShareCard
                    title={cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                    verdict={vote.verdict as 'PRZYJĘTO' | 'ODRZUCONO'}
                    date={formatPolishDate(vote.date)}
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
