import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, ArrowLeft, CheckCircle2, XCircle, MinusCircle, HelpCircle } from 'lucide-react';

interface EuroMP {
    id: number;
    api_id: number;
    full_name: string;
    country: string;
    national_party: string;
    eu_group: string;
    photo_url: string;
    active: boolean;
}

interface EuroVoteHistoryItem {
    vote: string;
    euro_votes: {
        id: string;
        title: string;
        date: string;
        votes_for: number;
        votes_against: number;
        votes_abstain: number;
    };
}

const EuroMPProfile = () => {
    const { id } = useParams();
    const [mp, setMp] = useState<EuroMP | null>(null);
    const [voteHistory, setVoteHistory] = useState<EuroVoteHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMpData = async () => {
            if (!id) return;
            try {
                // 1. Fetch MP Details
                const { data: mpData, error: mpError } = await supabase
                    .from('euro_meps')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (mpError) throw mpError;
                setMp(mpData);

                // 2. Fetch Voting History
                // Link via api_id (which is in euro_vote_results.mep_id)
                if (mpData && mpData.api_id) {
                    const { data: historyData, error: historyError } = await supabase
                        .from('euro_vote_results')
                        .select('vote, euro_votes(id, title, date, votes_for, votes_against, votes_abstain)')
                        .eq('mep_id', mpData.api_id)
                        .order('created_at', { ascending: false }) // OR order by date in join?
                        .limit(20);

                    if (!historyError && historyData) {
                        // sort by date client side if needed, or trust created_at for now
                        setVoteHistory(historyData as any);
                    }
                }

            } catch (error) {
                console.error('Error fetching Euro MP data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMpData();
    }, [id]);

    if (loading) return <div className="text-center py-12 text-slate-500">Ładowanie profilu europosła...</div>;

    if (!mp) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Europoseł nie znaleziony.</p>
                <Link to="/europarlament" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
                    Wróć do listy
                </Link>
            </div>
        );
    }

    const getPartyColor = (party: string) => {
        // Mapping mostly Polish parties to colors
        const colors: Record<string, string> = {
            'Prawo i Sprawiedliwość': '#003399', // Dark Blue - PiS
            'Koalicja Obywatelska': '#F66F42',   // Orange/Red/Blue mix, standard KO often orange/blue. Let's start with user request "KO: Red" or similar? 
            // User said: "PiS: Blue", "KO: Red", "Polska 2050: Yellow"
            // Wait, user request history from conversation summary said:
            // "PiS: Blue", "KO: Red", "Polska 2050: Yellow"

            'Platforma Obywatelska': '#DC143C', // Reddish
            'Sojusz Lewicy Demokratycznej': '#E30613', // Red
            'Nowa Lewica': '#E30613',
            'Polskie Stronnictwo Ludowe': '#1BB100', // Green
            'Polska 2050': '#F0D719', // Yellow
            'Ruch Narodowy': '#122646', // Dark
            'Nowa Nadzieja': '#122646',
            'Konfederacja': '#122646',

            // Short names or alternates
            'PiS': '#003399',
            'KO': '#DC143C',
            'Lewica': '#E30613',
            'Trzecia Droga (PSL)': '#1BB100',
            'Trzecia Droga (Polska 2050)': '#F0D719'
        };

        // Normalize logic? 
        if (party.includes('Prawo i Sprawiedliwość') || party.includes('PiS')) return '#003399';
        if (party.includes('Obywatelska') || party.includes('KO')) return '#DC143C'; // Red as requested
        if (party.includes('Lewica')) return '#800080'; // Gradient purple to red requested? Let's use generic purple/red or just red.
        if (party.includes('2050')) return '#F0D719'; // Yellow
        if (party.includes('Ludowe') || party.includes('PSL')) return '#1BB100';
        if (party.includes('Konfederacja')) return '#0f172a';

        return colors[party] || '#64748B';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pt-28 pb-12 px-4 animate-fade-in bg-paper dark:bg-[#1e1b4b] min-h-screen text-neutral-900 dark:text-white">
            {/* Back Button */}
            <Link to="/europarlament" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold">
                <ArrowLeft size={20} />
                Wróć do listy
            </Link>

            {/* SECTION A: Identity Header */}
            <div className="bg-white dark:bg-[#0f0c29] rounded-xl border border-neutral-200 dark:border-indigo-900/50 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Large Photo */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl pointer-events-none" />
                        <img
                            src={mp.photo_url}
                            alt={mp.full_name}
                            className="w-48 h-48 md:w-64 md:h-64 rounded-xl object-cover object-top border-4 border-white dark:border-[#24243e] shadow-lg"
                            onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/256x256/E2E8F0/64748B?text=MP';
                            }}
                        />
                    </div>

                    {/* Identity Info */}
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                            {mp.full_name}
                        </h1>

                        {/* Badges Row */}
                        <div className="flex flex-wrap gap-3">
                            {/* Party Badge */}
                            <span
                                className="px-4 py-2 rounded-full text-white text-sm font-bold uppercase tracking-wide shadow-sm"
                                style={{ backgroundColor: getPartyColor(mp.national_party) }}
                            >
                                {mp.national_party}
                            </span>

                            {/* EU Group Badge */}
                            <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-bold uppercase tracking-wide">
                                <MapPin size={14} className="inline mr-1" />
                                {mp.eu_group}
                            </span>

                            <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-sm font-semibold">
                                Parlament Europejski (2024-2029)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION D: Voting History Timeline */}
            <div className="bg-white dark:bg-[#0f0c29] rounded-xl border border-neutral-200 dark:border-indigo-900/50 p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                    Ostatnie głosowania w PE
                </h2>

                {voteHistory.length > 0 ? (
                    <div className="space-y-4">
                        {voteHistory.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-4 border-b border-slate-100 dark:border-indigo-900/30 last:border-0 hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-colors rounded-lg px-2">
                                <div className="flex-1">
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                        {item.euro_votes?.date || 'Data nieznana'}
                                    </div>
                                    <span className="text-slate-900 dark:text-white font-medium line-clamp-2">
                                        {item.euro_votes?.title || 'Głosowanie bez tytułu'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* MP Vote */}
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide w-fit border ${item.vote === 'For' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                            item.vote === 'Against' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                                item.vote === 'Abstain' ? 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700' :
                                                    'bg-slate-100 text-slate-500 border-slate-200'
                                        }`}>
                                        {item.vote === 'For' && <CheckCircle2 size={16} />}
                                        {item.vote === 'Against' && <XCircle size={16} />}
                                        {item.vote === 'Abstain' && <MinusCircle size={16} />}
                                        {item.vote === 'Absent' && <HelpCircle size={16} />}

                                        {item.vote === 'For' ? 'ZA' :
                                            item.vote === 'Against' ? 'PRZECIW' :
                                                item.vote === 'Abstain' ? 'WSTRZ.' : 'NIEOB.'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">Brak zarejestrowanych głosowań dla tego posła w naszej bazie.</p>
                )}
            </div>
        </div>
    );
}

export default EuroMPProfile;
