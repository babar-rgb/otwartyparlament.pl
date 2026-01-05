import { useState, useEffect, useMemo } from 'react';
import { fetchMPs, fetchSpeeches, fetchInterpellations, fetchVoteResults } from '../api';
import SEO from '../components/SEO';
import { MP } from '../api';
import { Search, Swords, Trophy, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Comparator({ embedded = false }: { embedded?: boolean }) {
    const [mps, setMps] = useState<MP[]>([]);
    const [loading, setLoading] = useState(true);
    const [mpA, setMpA] = useState<MP | null>(null);
    const [mpB, setMpB] = useState<MP | null>(null);
    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');

    useEffect(() => {
        const fetchMPsAction = async () => {
            try {
                const data = await fetchMPs({ limit: 1000 });
                setMps(data);
            } catch (err) {
                console.error('Error fetching MPs:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMPsAction();
    }, []);

    const filteredMPsA = useMemo(() => {
        if (!searchA) return [];
        return mps.filter(mp =>
            `${mp.first_name} ${mp.last_name}`.toLowerCase().includes(searchA.toLowerCase()) &&
            mp.id !== mpB?.id
        ).slice(0, 5);
    }, [mps, searchA, mpB]);

    const filteredMPsB = useMemo(() => {
        if (!searchB) return [];
        return mps.filter(mp =>
            `${mp.first_name} ${mp.last_name}`.toLowerCase().includes(searchB.toLowerCase()) &&
            mp.id !== mpA?.id
        ).slice(0, 5);
    }, [mps, searchB, mpA]);

    const [similarity, setSimilarity] = useState<number | null>(null);
    const [calculatingSim, setCalculatingSim] = useState(false);

    useEffect(() => {
        if (!mpA || !mpB) {
            setSimilarity(null);
            return;
        }

        const calculateSimilarity = async () => {
            setCalculatingSim(true);
            try {
                // Fetch results for both MPs. 
                // Note: We don't have a specific "shared votes" endpoint yet, 
                // but we can fetch recent votes for both and compare.
                // For now, let's assume we can fetch results by MP
                const resultsA = await fetchVoteResults({ mp_id: mpA.id, limit: 200 });
                const resultsB = await fetchVoteResults({ mp_id: mpB.id, limit: 200 });

                const votesMapA = new Map(resultsA.map((r: any) => [r.vote_id, r.vote]));
                const votesMapB = new Map(resultsB.map((r: any) => [r.vote_id, r.vote]));

                let sharedParam = 0;
                let agreement = 0;

                for (const [voteId, resA] of votesMapA) {
                    const resB = votesMapB.get(voteId);
                    if (resB) {
                        sharedParam++;
                        if (resA === resB) agreement++;
                    }
                }

                if (sharedParam < 5) {
                    setSimilarity(null);
                } else {
                    setSimilarity(Math.round((agreement / sharedParam) * 100));
                }

            } catch (err) {
                console.error("Error calculating similarity:", err);
            } finally {
                setCalculatingSim(false);
            }
        };

        calculateSimilarity();
    }, [mpA?.id, mpB?.id]);

    const [keyVotes, setKeyVotes] = useState<any[]>([]);
    const [loadingVotes, setLoadingVotes] = useState(false);

    useEffect(() => {
        if (!mpA || !mpB) return;

        const fetchKeyVotesAction = async () => {
            setLoadingVotes(true);
            try {
                // 1. We need key votes. Let's assume fetchVotes can filter for key votes or we just fetch recent.
                // For now, let's just fetch recent important-ish votes.
                const { items: recentVotes } = await fetchVotes({ limit: 10 });

                const votesWithDecisions = await Promise.all(recentVotes.map(async (vote: any) => {
                    try {
                        // Find results for both MPs for this vote
                        // Note: We might need fetchVoteResults for a specific vote
                        const results = await fetchVoteResults({ vote_id: vote.id, mp_ids: [mpA.id, mpB.id] });

                        const voteAResult = results.find((r: any) => r.mp_id === mpA.id)?.vote || 'Nieobecny';
                        const voteBResult = results.find((r: any) => r.mp_id === mpB.id)?.vote || 'Nieobecny';

                        return {
                            ...vote,
                            voteA: voteAResult,
                            voteB: voteBResult
                        };
                    } catch (e) {
                        console.error(`Error fetching details for vote ${vote.id}`, e);
                        return { ...vote, voteA: '?', voteB: '?' };
                    }
                }));

                setKeyVotes(votesWithDecisions.filter(v => v.voteA !== '?' && v.voteB !== '?').slice(0, 5));
            } catch (err) {
                console.error('Error fetching key votes:', err);
            } finally {
                setLoadingVotes(false);
            }
        };

        fetchKeyVotesAction();
    }, [mpA, mpB]);

    // Extra Stats
    useEffect(() => {
        const fetchExtraStats = async () => {
            const getStats = async (mpId: number) => {
                // We'd need these endpoints or counts in backend
                // For now, let's keep them as 0 or placeholder if not available
                try {
                    // Placeholder calls - we'll need to check if these exist in api.ts
                    const sCount = 0; // await fetchSpeechesCount({ mp_id: mpId });
                    const iCount = 0; // await fetchInterpellationsCount({ mp_id: mpId });
                    return { speeches: sCount, interpellations: iCount };
                } catch (e) { return { speeches: 0, interpellations: 0 }; }
            };

            if (mpA) {
                getStats(mpA.id).then(stats => setMpA(prev => prev ? { ...prev, stats } as any : null));
            }
            if (mpB) {
                getStats(mpB.id).then(stats => setMpB(prev => prev ? { ...prev, stats } as any : null));
            }
        };

        if ((mpA && !mpA.stats?.speeches) || (mpB && !mpB.stats?.speeches)) {
            // fetchExtraStats(); // Disabled until counts are reliable in backend
        }
    }, [mpA?.id, mpB?.id]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${embedded ? 'py-12' : 'min-h-screen pt-24'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className={embedded ? 'animate-fade-in' : 'container mx-auto px-4 pt-24 pb-12 max-w-6xl animate-fade-in'}>
            {!embedded && (
                <SEO
                    title={mpA && mpB ? `${mpA.last_name} vs ${mpB.last_name} | Porównanie` : "Porównywarka Posłów"}
                    description={mpA && mpB ? `Sprawdź jak głosowali ${mpA.first_name} ${mpA.last_name} i ${mpB.first_name} ${mpB.last_name}. Porównaj ich statystyki i zgodność.` : "Porównaj poglądy i głosowania dwóch dowolnych posłów Sejmu RP."}
                    url="/porownywarka"
                />
            )}
            {!embedded && (
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full font-bold text-sm mb-6 border border-purple-100">
                        <Swords size={16} />
                        <span>Versus Mode</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                        Porównywarka <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Posłów</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Sprawdź, jak bardzo różnią się Twoi reprezentanci. Porównaj ich głosowania, frekwencję i statystyki buntu.
                    </p>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-8 items-start mb-16 relative">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 relative z-10">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Poseł A</h3>

                    {!mpA ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Wpisz nazwisko..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={searchA}
                                onChange={(e) => setSearchA(e.target.value)}
                            />
                            {filteredMPsA.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20">
                                    {filteredMPsA.map(mp => (
                                        <button
                                            key={mp.id}
                                            onClick={() => { setMpA(mp); setSearchA(''); }}
                                            className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 transition-colors"
                                        >
                                            <img src={mp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <div className="font-bold text-slate-900">{mp.first_name} {mp.last_name}</div>
                                                <div className="text-xs text-slate-500">{mp.club}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center animate-in zoom-in duration-300">
                            <div className="relative inline-block mb-4">
                                <img src={mpA.photo_url} alt={mpA.last_name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                                <button
                                    onClick={() => setMpA(null)}
                                    className="absolute -top-2 -right-2 bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 rounded-full p-1 transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">{mpA.first_name} {mpA.last_name}</h2>
                            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-600 mt-2 border border-slate-200">
                                {mpA.club}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center pt-8 md:pt-20 relative z-0">
                    {mpA && mpB ? (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            <div className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center">
                                {calculatingSim ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                    </div>
                                ) : (
                                    <>
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                            {similarity !== null && (
                                                <circle
                                                    cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8"
                                                    strokeDasharray="283"
                                                    strokeDashoffset={283 - (283 * similarity / 100)}
                                                    strokeLinecap="round"
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            )}
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#9333ea" />
                                                    <stop offset="100%" stopColor="#ec4899" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            {similarity !== null ? (
                                                <>
                                                    <span className="text-4xl font-black text-slate-900">{similarity}%</span>
                                                    <span className="text-xs font-bold text-slate-500 uppercase">Zgodności</span>
                                                </>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400 text-center px-4">Brak wspólnych głosowań</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-black text-xl border-4 border-slate-50 dark:border-slate-900 shadow-sm">
                            VS
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 relative z-10">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Poseł B</h3>

                    {!mpB ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Wpisz nazwisko..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                value={searchB}
                                onChange={(e) => setSearchB(e.target.value)}
                            />
                            {filteredMPsB.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20">
                                    {filteredMPsB.map(mp => (
                                        <button
                                            key={mp.id}
                                            onClick={() => { setMpB(mp); setSearchB(''); }}
                                            className="w-full text-left px-4 py-3 hover:bg-purple-50 flex items-center gap-3 transition-colors"
                                        >
                                            <img src={mp.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            <div>
                                                <div className="font-bold text-slate-900">{mp.first_name} {mp.last_name}</div>
                                                <div className="text-xs text-slate-500">{mp.club}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center animate-in zoom-in duration-300">
                            <div className="relative inline-block mb-4">
                                <img src={mpB.photo_url} alt={mpB.last_name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />
                                <button
                                    onClick={() => setMpB(null)}
                                    className="absolute -top-2 -right-2 bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 rounded-full p-1 transition-colors"
                                >
                                    <XCircle size={20} />
                                </button>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">{mpB.first_name} {mpB.last_name}</h2>
                            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-sm font-bold text-slate-600 mt-2 border border-slate-200">
                                {mpB.club}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {mpA && mpB && (
                <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 order-1 md:order-2">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            Kluczowe Głosowania
                        </h3>

                        {loadingVotes ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {keyVotes.map((vote) => {
                                    const agree = vote.voteA === vote.voteB;
                                    return (
                                        <div key={vote.id} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className={`p-2 rounded-full ${agree ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {agree ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-900 line-clamp-2">
                                                    {vote.title_clean || vote.title_raw}
                                                </div>
                                                <div className="text-xs text-slate-500 flex gap-4 mt-2">
                                                    <span>{mpA.last_name}: <strong className={vote.voteA === 'Za' ? 'text-green-600' : vote.voteA === 'Przeciw' ? 'text-red-600' : 'text-slate-500'}>{vote.voteA}</strong></span>
                                                    <span>{mpB.last_name}: <strong className={vote.voteB === 'Za' ? 'text-green-600' : vote.voteB === 'Przeciw' ? 'text-red-600' : 'text-slate-500'}>{vote.voteB}</strong></span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 order-2 md:order-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Trophy className="text-yellow-500" />
                            Statystyki
                        </h3>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between text-sm font-bold text-slate-500 mb-4">
                                    <span>Frekwencja</span>
                                </div>
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>{mpA.last_name}</span>
                                        <span>{mpA.attendanceRate}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${mpA.attendanceRate}%` }}
                                            className="h-full bg-purple-500 rounded-full"
                                        ></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>{mpB.last_name}</span>
                                        <span>{mpB.attendanceRate}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${mpB.attendanceRate}%` }}
                                            className="h-full bg-pink-500 rounded-full"
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                                    <span>Buntownik (Głosy przeciw partii)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-slate-900 w-12 text-right">{mpA.rebelVotes || 0}</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300"></div>
                                        <div
                                            style={{ width: `${Math.min((mpA.rebelVotes || 0) * 2, 50)}%`, right: '50%' }}
                                            className="absolute top-0 h-full bg-purple-500 rounded-l-full"
                                        ></div>
                                        <div
                                            style={{ width: `${Math.min((mpB.rebelVotes || 0) * 2, 50)}%`, left: '50%' }}
                                            className="absolute top-0 h-full bg-pink-500 rounded-r-full"
                                        ></div>
                                    </div>
                                    <span className="font-black text-slate-900 w-12">{mpB.rebelVotes || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
