import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/db';
import { ArrowLeft, Calendar } from 'lucide-react';

interface EuroVote {
    id: string;
    title: string;
    date: string;
    description?: string;
    votes_for?: number;
    votes_against?: number;
    votes_abstain?: number;
    topic_tag?: string;
}

const EuroVoteDetails: React.FC = () => {
    const { id } = useParams();
    const [vote, setVote] = useState<EuroVote | null>(null);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchVote();
            fetchResults();
        }
    }, [id]);

    const fetchVote = async () => {
        const { data, error } = await db
            .from('euro_votes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) console.error(error);
        else setVote(data);
        setLoading(false);
    };

    const fetchResults = async () => {
        const { data, error } = await db
            .from('euro_vote_results')
            .select('*, mep:euro_meps(full_name, national_party, photo_url)')
            .eq('vote_id', id);

        if (error) console.error(error);
        else setResults(data || []);
    };

    // Calculate stats
    const stats = {
        for: results.filter(r => r.vote === 'For').length,
        against: results.filter(r => r.vote === 'Against').length,
        abstain: results.filter(r => r.vote === 'Abstain').length,
        absent: results.filter(r => r.vote === 'Absent').length,
    };

    const partyStats = React.useMemo(() => {
        const acc: Record<string, { for: number; against: number; abstain: number; absent: number; total: number }> = {};

        results.forEach(r => {
            const party = r.mep?.national_party || 'Inne';
            if (!acc[party]) acc[party] = { for: 0, against: 0, abstain: 0, absent: 0, total: 0 };

            const v = r.vote?.toLowerCase();
            if (v === 'for') acc[party].for++;
            else if (v === 'against') acc[party].against++;
            else if (v === 'abstain') acc[party].abstain++;
            else acc[party].absent++;

            acc[party].total++;
        });

        // Filter out small/empty if needed, or keep all
        return Object.entries(acc).sort((a, b) => b[1].total - a[1].total);
    }, [results]);

    if (loading) return <div className="p-12 text-center text-neutral-500">Ładowanie...</div>;
    if (!vote) return <div className="p-12 text-center text-neutral-500">Nie znaleziono głosowania.</div>;


    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1f36] text-neutral-900 dark:text-white p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <Link to="/europarlament" className="inline-flex items-center gap-2 text-neutral-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do Europarlamentu
                </Link>

                <div className="bg-white dark:bg-[#24243e] rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-indigo-900/50">
                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                        <Calendar className="w-4 h-4" />
                        {new Date(vote.date).toLocaleDateString('pl-PL')}
                        <span className="text-neutral-300">|</span>
                        <span>ID: {vote.id}</span>
                        {/* Tag */}
                        {vote.topic_tag && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
                                {vote.topic_tag}
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold leading-tight mb-8">
                        {vote.title}
                    </h1>

                    {/* Description & AI Analysis */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800 mb-8">
                        <h2 className="text-sm font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-3 tracking-wider flex items-center gap-2">
                            🧠 Analiza (Kontekst)
                        </h2>

                        {/* Context Description */}
                        {vote.description ? (
                            <p className="text-lg text-neutral-800 dark:text-neutral-200 leading-relaxed mb-4">
                                {vote.description.replace(/ \| .*$/, '')}
                            </p>
                        ) : (
                            <p className="text-neutral-500 italic mb-4">Brak dodatkowego opisu kontekstowego.</p>
                        )}

                        {/* Heuristic Stats Analysis */}
                        <div className="flex flex-wrap gap-3 mt-4">
                            {/* Consensus Badge */}
                            {(() => {
                                const total = (vote.votes_for || 0) + (vote.votes_against || 0) + (vote.votes_abstain || 0);
                                if (total === 0) return null;
                                const ratio = (vote.votes_for || 0) / total;
                                const againstRatio = (vote.votes_against || 0) / total;

                                if (ratio > 0.8) return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">✅ Szeroki Konsensus</span>;
                                if (againstRatio > 0.4) return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">🔥 Wysoka Kontrowersja</span>;
                                if (ratio > 0.5) return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">⚖️ Przewaga Większości</span>;
                                return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200">⚠️ Niejednoznaczny Wynik</span>;
                            })()}

                            {/* Attendance Badge */}
                            {(() => {
                                const total = (vote.votes_for || 0) + (vote.votes_against || 0) + (vote.votes_abstain || 0);
                                if (total > 600) return <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">👥 Wysoka Frekwencja ({total})</span>;
                                if (total > 0 && total < 300) return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">📉 Niska Frekwencja</span>;
                                return null;
                            })()}
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-800">
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.for}</div>
                            <div className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase">Za</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-800">
                            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.against}</div>
                            <div className="text-xs font-semibold text-red-600 dark:text-red-500 uppercase">Przeciw</div>
                        </div>
                        <div className="bg-neutral-50 dark:bg-white/5 p-4 rounded-xl text-center border border-neutral-200 dark:border-white/10">
                            <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-400">{stats.abstain}</div>
                            <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-500 uppercase">Wstrzymał się</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                            <div className="text-2xl font-bold text-slate-700 dark:text-slate-400">{stats.absent}</div>
                            <div className="text-xs font-semibold text-slate-600 dark:text-slate-500 uppercase">Nieobecny</div>
                        </div>
                    </div>
                    {/* Hemicycle & Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Hemicycle Chart */}
                        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 flex flex-col items-center justify-center relative min-h-[300px]">
                            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm absolute top-6 left-6">Wynik Głosowania</h3>

                            {/* SVG Hemicycle */}
                            <div className="w-full max-w-md aspect-[2/1] relative mt-8">
                                <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                                    {(() => {
                                        // Helper to derive result

                                        const total = (vote.votes_for || 0) + (vote.votes_against || 0) + (vote.votes_abstain || 0);
                                        if (total === 0) return null;

                                        // Arcs
                                        const createArc = (startPct: number, endPct: number, color: string) => {
                                            const r = 90;
                                            const startAngle = Math.PI * (1 - startPct);
                                            const endAngle = Math.PI * (1 - endPct);

                                            const x1 = 100 + r * Math.cos(startAngle);
                                            const y1 = 100 - r * Math.sin(startAngle);
                                            const x2 = 100 + r * Math.cos(endAngle);
                                            const y2 = 100 - r * Math.sin(endAngle);

                                            // Large arc flag
                                            // Since we are drawing on a semicircle (max PI), the arc length is max PI (180deg).
                                            // The A command refers to the full ellipse (360). 
                                            // So any segment <= 180 deg (which is 100% of our chart) is a "small arc".
                                            // Only if we spanned > 180 degrees would we need 1.
                                            const largeArc = 0;

                                            return (
                                                <path
                                                    d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                                                    fill="none"
                                                    stroke={color}
                                                    strokeWidth="18"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            );
                                        };

                                        const yesPct = (vote.votes_for || 0) / total;
                                        const abstainPct = (vote.votes_abstain || 0) / total;

                                        return (
                                            <>
                                                {/* Background Track */}
                                                <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="#1e293b" strokeWidth="18" />

                                                {/* Segments */}
                                                {createArc(0, yesPct, '#22c55e')}
                                                {createArc(yesPct, yesPct + abstainPct, '#94a3b8')}
                                                {createArc(yesPct + abstainPct, 1, '#ef4444')}
                                            </>
                                        );
                                    })()}
                                </svg>

                                {/* Center Result Text */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center mb-4">
                                    <div className={`text-4xl font-black ${(vote.votes_for || 0) > (vote.votes_against || 0) ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {(vote.votes_for || 0) > (vote.votes_against || 0) ? 'Przyjęto' : 'Odrzucono'}
                                    </div>
                                    <div className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                                        Decyzja Parlamentu
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex gap-6 mt-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className="text-slate-300 font-medium">Za: {vote.votes_for}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                    <span className="text-slate-300 font-medium">Wstrz.: {vote.votes_abstain}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-slate-300 font-medium">Przeciw: {vote.votes_against}</span>
                                </div>
                            </div>
                        </div>

                        {/* Rebel Stats */}
                        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700/50 flex flex-col">
                            <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-4">Wyłamali się</h3>
                            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[300px]">
                                {(() => {
                                    // Calculate Rebels
                                    const rebels = results.filter(r => {
                                        if (!r.mep || !r.mep.national_party) return false;
                                        const party = r.mep.national_party;
                                        // partyStats is an array of [partyName, statsObject], so we need to find the correct stats object
                                        const partyStat = partyStats.find(([p]) => p === party)?.[1];
                                        if (!partyStat) return false;

                                        // Determine party line
                                        const max = Math.max(partyStat.for, partyStat.against, partyStat.abstain);
                                        let partyLine = '';
                                        if (partyStat.for === max) partyLine = 'For';
                                        else if (partyStat.against === max) partyLine = 'Against';
                                        else partyLine = 'Abstain';

                                        // Check if rebel
                                        return r.vote !== partyLine && r.vote !== 'Absent' && partyLine !== '';
                                    });

                                    if (rebels.length === 0) {
                                        return (
                                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                                <div className="mb-2">🤝</div>
                                                <div>Pełna dyscyplina partyjna</div>
                                                <div className="text-xs opacity-50">Brak buntowników</div>
                                            </div>
                                        );
                                    }

                                    return rebels.map((r: any) => (
                                        <Link to={`/europarlament/${r.mep?.id}`} key={r.mep?.id || Math.random()} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors group">
                                            <img src={r.mep?.photo_url || ''} alt={r.mep?.full_name} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <div className="text-sm font-bold text-slate-200 group-hover:text-blue-400">{r.mep?.full_name}</div>
                                                <div className="text-xs text-slate-400">{r.mep?.national_party}</div>
                                            </div>
                                            <div className="ml-auto text-xs font-bold px-2 py-1 rounded bg-slate-800 border border-slate-600">
                                                {r.vote === 'For' ? <span className="text-green-500">ZA</span> :
                                                    r.vote === 'Against' ? <span className="text-red-500">PRZECIW</span> :
                                                        <span className="text-slate-400">WSTRZ.</span>}
                                            </div>
                                        </Link>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Party Breakdown Stacked Bars */}
                    <div className="mb-8">
                        <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-4">Głosowanie wg Frakcji</h3>
                        <div className="space-y-4">
                            {partyStats
                                .sort((a: any, b: any) => (b[1].for + b[1].against + b[1].abstain) - (a[1].for + a[1].against + a[1].abstain))
                                .map(([party, stats]: [string, any]) => {
                                    const total = stats.for + stats.against + stats.abstain + stats.absent;
                                    // Stacked Bar
                                    return (
                                        <div key={party} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-bold text-white w-24">{party}</div>
                                                <div className="flex gap-4 text-xs font-mono text-slate-400">
                                                    <span className="text-green-400">ZA: {stats.for}</span>
                                                    <span className="text-red-400">PRZECIW: {stats.against}</span>
                                                    <span className="text-slate-400">WSTRZ: {stats.abstain}</span>
                                                </div>
                                            </div>
                                            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex">
                                                <div style={{ width: `${(stats.for / total) * 100}%` }} className="bg-green-600 h-full first:rounded-l-full relative group">
                                                    <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-xs p-1 rounded">
                                                        {((stats.for / total) * 100).toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div style={{ width: `${(stats.against / total) * 100}%` }} className="bg-red-600 h-full relative group"></div>
                                                <div style={{ width: `${(stats.abstain / total) * 100}%` }} className="bg-slate-500 h-full relative group"></div>
                                                <div style={{ width: `${(stats.absent / total) * 100}%` }} className="bg-slate-800 h-full opacity-50"></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Check for results */}
                    {results.length > 0 ? (
                        <div className="space-y-12">

                            {/* Detailed List */}
                            <div>
                                <h3 className="font-bold text-xl mb-6">Wyniki imienne (Polska delegacja)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {results.map(r => (
                                        <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors">
                                            <div className={`w-2 h-2 rounded-full ${r.vote === 'For' ? 'bg-green-500' :
                                                r.vote === 'Against' ? 'bg-red-500' :
                                                    r.vote === 'Abstain' ? 'bg-neutral-400' :
                                                        'bg-slate-300'
                                                }`} />
                                            <img src={r.mep?.photo_url} className="w-8 h-8 rounded-full object-cover bg-neutral-200" alt="" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32'} />
                                            <div>
                                                <div className="font-semibold text-sm">{r.mep?.full_name || 'Nieznany poseł'}</div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400">{r.mep?.national_party}</div>
                                            </div>
                                            <div className={`ml-auto text-xs font-bold opacity-70 ${r.vote === 'For' ? 'text-green-600 dark:text-green-400' :
                                                r.vote === 'Against' ? 'text-red-600 dark:text-red-400' : ''
                                                }`}>
                                                {r.vote === 'For' ? 'ZA' : r.vote === 'Against' ? 'PRZECIW' : r.vote === 'Abstain' ? 'WSTRZ.' : 'NIEOB.'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    ) : (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-200">
                            Szczegółowe wyniki tego głosowania są jeszcze przetwarzane. Spróbuj odświeżyć za chwilę.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EuroVoteDetails;
