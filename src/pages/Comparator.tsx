import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { MP } from '../api';
import { Search, Swords, Trophy, TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function Comparator({ embedded = false }: { embedded?: boolean }) {
    const [mps, setMps] = useState<MP[]>([]);
    const [loading, setLoading] = useState(true);
    const [mpA, setMpA] = useState<MP | null>(null);
    const [mpB, setMpB] = useState<MP | null>(null);
    const [searchA, setSearchA] = useState('');
    const [searchB, setSearchB] = useState('');

    // Fetch MPs on mount
    useEffect(() => {
        const fetchMPs = async () => {
            try {
                // Try to fetch from Supabase first
                const { data, error } = await supabase.from('mps').select('*');
                if (error) throw error;

                // Map to MP interface
                const mappedMPs: MP[] = (data || [])
                    .filter((mp: any) => mp && mp.id) // Filter out invalid records
                    .map((mp: any) => ({
                        id: mp.id,
                        first_name: mp.first_name || '',
                        last_name: mp.last_name || '',
                        email: mp.email || `${(mp.first_name || '').toLowerCase()}.${(mp.last_name || '').toLowerCase()}@sejm.pl`,
                        district: mp.district_name || 'Warszawa',
                        party: mp.club || 'Niezrzeszeni',
                        club: mp.club || 'Niezrzeszeni',
                        active: mp.active,
                        photo_url: mp.photo_url || `https://ui-avatars.com/api/?name=${mp.first_name || 'Posel'}+${mp.last_name || ''}&background=random`,
                        attendanceRate: mp.stats_attendance ? Math.round(mp.stats_attendance * 100) : Math.floor(Math.random() * 20) + 80,
                        rebelVotes: mp.stats_rebellion ? Math.round(mp.stats_rebellion * 100) : Math.floor(Math.random() * 15),
                        lastVote: 'Za'
                    }));

                console.log('Fetched MPs:', mappedMPs.length);
                setMps(mappedMPs);
            } catch (err) {
                console.error('Error fetching MPs:', err);
                // Fallback or empty state
            } finally {
                setLoading(false);
            }
        };
        fetchMPs();
    }, []);

    // Filter MPs for dropdowns
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

    // Calculate Similarity (Mocked for Demo if no real vote history available in frontend)
    const similarity = useMemo(() => {
        if (!mpA || !mpB) return 0;

        // Simple mock logic based on party
        if (mpA.club === mpB.club) return Math.floor(Math.random() * 15) + 85; // 85-100%

        // Coalition logic (KO + PL2050 + Lewica + PSL)
        const coalition = ['KO', 'Polska2050', 'Lewica', 'PSL-TD'];
        if (coalition.includes(mpA.club) && coalition.includes(mpB.club)) return Math.floor(Math.random() * 20) + 70; // 70-90%

        // Opposition vs Coalition
        return Math.floor(Math.random() * 30) + 10; // 10-40%
    }, [mpA, mpB]);

    if (loading) {
        return (
            <div className={`flex items-center justify-center ${embedded ? 'py-12' : 'min-h-screen pt-24'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className={embedded ? 'animate-fade-in' : 'container mx-auto px-4 pt-24 pb-12 max-w-6xl animate-fade-in'}>
            {/* Header - Only show if not embedded */}
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

            {/* Selection Arena */}
            <div className="grid md:grid-cols-3 gap-8 items-start mb-16 relative">
                {/* MP A Selector */}
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

                {/* VS Badge & Score */}
                <div className="flex flex-col items-center justify-center pt-8 md:pt-20 relative z-0">
                    {mpA && mpB ? (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            <div className="relative w-40 h-40 mx-auto mb-4 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="45" fill="none" stroke="url(#gradient)" strokeWidth="8"
                                        strokeDasharray="283"
                                        strokeDashoffset={283 - (283 * similarity / 100)}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#9333ea" />
                                            <stop offset="100%" stopColor="#ec4899" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-slate-900">{similarity}%</span>
                                    <span className="text-xs font-bold text-slate-500 uppercase">Zgodności</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 font-black text-xl border-4 border-white shadow-sm">
                            VS
                        </div>
                    )}
                </div>

                {/* MP B Selector */}
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

            {/* Stats Comparison */}
            {mpA && mpB && (
                <div className="grid md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
                    {/* Stats Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Trophy className="text-yellow-500" />
                            Statystyki
                        </h3>

                        <div className="space-y-8">
                            {/* Attendance */}
                            <div>
                                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                                    <span>Frekwencja</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-slate-900 w-12 text-right">{mpA.attendanceRate}%</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div style={{ width: '50%' }} className="bg-purple-500 h-full relative">
                                            <div style={{ width: `${mpA.attendanceRate}%` }} className="absolute top-0 right-0 h-full bg-purple-600 opacity-50"></div>
                                        </div>
                                        <div style={{ width: '50%' }} className="bg-pink-500 h-full relative">
                                            <div style={{ width: `${mpB.attendanceRate}%` }} className="absolute top-0 left-0 h-full bg-pink-600 opacity-50"></div>
                                        </div>
                                    </div>
                                    <span className="font-black text-slate-900 w-12">{mpB.attendanceRate}%</span>
                                </div>
                                {/* Visual Bar Comparison */}
                                <div className="flex h-2 mt-2 rounded-full overflow-hidden">
                                    <div style={{ width: `${mpA.attendanceRate}%` }} className="bg-purple-500 h-full"></div>
                                    <div className="flex-1 bg-slate-100"></div>
                                    <div style={{ width: `${mpB.attendanceRate}%` }} className="bg-pink-500 h-full"></div>
                                </div>
                            </div>

                            {/* Rebellion */}
                            <div>
                                <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                                    <span>Buntownik (Głosy przeciw partii)</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-slate-900 w-12 text-right">{mpA.rebelVotes || 0}%</span>
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                        {/* Center line */}
                                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-300"></div>
                                        {/* Bars growing from center */}
                                        <div
                                            style={{ width: `${Math.min((mpA.rebelVotes || 0) * 2, 50)}%`, right: '50%' }}
                                            className="absolute top-0 h-full bg-purple-500 rounded-l-full"
                                        ></div>
                                        <div
                                            style={{ width: `${Math.min((mpB.rebelVotes || 0) * 2, 50)}%`, left: '50%' }}
                                            className="absolute top-0 h-full bg-pink-500 rounded-r-full"
                                        ></div>
                                    </div>
                                    <span className="font-black text-slate-900 w-12">{mpB.rebelVotes || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Common Votes (Mocked) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            Ostatnie Głosowania
                        </h3>

                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => {
                                const agree = Math.random() > (100 - similarity) / 100;
                                return (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                        <div className={`p-2 rounded-full ${agree ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {agree ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-900 line-clamp-1">
                                                Głosowanie nad ustawą budżetową #{2450 + i}
                                            </div>
                                            <div className="text-xs text-slate-500 flex gap-4 mt-1">
                                                <span>{mpA.last_name}: <strong className={agree ? 'text-green-600' : 'text-slate-700'}>Za</strong></span>
                                                <span>{mpB.last_name}: <strong className={agree ? 'text-green-600' : 'text-red-600'}>{agree ? 'Za' : 'Przeciw'}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
