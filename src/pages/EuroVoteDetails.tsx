import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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
        const { data, error } = await supabase
            .from('euro_votes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) console.error(error);
        else setVote(data);
        setLoading(false);
    };

    const fetchResults = async () => {
        const { data, error } = await supabase
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
                        {(vote as any).topic_tag && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
                                {(vote as any).topic_tag}
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

                    {/* Check for results */}
                    {results.length > 0 ? (
                        <div className="space-y-12">

                            {/* Party Breakdown Section */}
                            <div>
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                                    Jak głosowały partie?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {partyStats.map(([party, s]) => {
                                        return (
                                            <div key={party} className="bg-neutral-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-neutral-100 dark:border-indigo-900/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm">{party}</span>
                                                    <span className="text-xs text-neutral-500">{s.total} głosów</span>
                                                </div>
                                                {/* Bar */}
                                                <div className="h-4 w-full bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                                                    {s.for > 0 && <div style={{ width: `${(s.for / s.total) * 100}%` }} className="h-full bg-green-500" title={`Za: ${s.for}`} />}
                                                    {s.against > 0 && <div style={{ width: `${(s.against / s.total) * 100}%` }} className="h-full bg-red-500" title={`Przeciw: ${s.against}`} />}
                                                    {s.abstain > 0 && <div style={{ width: `${(s.abstain / s.total) * 100}%` }} className="h-full bg-neutral-400" title={`Wstrzymał się: ${s.abstain}`} />}
                                                    {s.absent > 0 && <div style={{ width: `${(s.absent / s.total) * 100}%` }} className="h-full bg-slate-300 dark:bg-slate-600" title={`Nieobecny: ${s.absent}`} />}
                                                </div>
                                                {/* Legend / Numbers */}
                                                <div className="flex justify-between mt-2 text-[10px] font-medium text-neutral-500 uppercase tracking-wide">
                                                    <span className={s.for > 0 ? "text-green-600" : ""}>Za: {s.for}</span>
                                                    <span className={s.against > 0 ? "text-red-600" : ""}>P: {s.against}</span>
                                                    <span className={s.abstain > 0 ? "text-neutral-600" : ""}>W: {s.abstain}</span>
                                                    <span>N: {s.absent}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

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
