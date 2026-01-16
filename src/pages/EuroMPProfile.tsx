import { useParams, Link } from 'react-router-dom';
import { useEuroMPProfile } from '../hooks/useEuroMPProfile';
import { MapPin, ArrowLeft, CheckCircle2, XCircle, MinusCircle, HelpCircle } from 'lucide-react';

const EuroMPProfile = () => {
    const { id } = useParams();
    const { data, isLoading: loading } = useEuroMPProfile(id);

    const mp = data?.mp;
    const voteHistory = data?.voteHistory || [];

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
        <div className="max-w-7xl mx-auto space-y-6 pt-28 pb-12 px-4 animate-fade-in min-h-screen bg-page text-primary transition-colors duration-500">
            {/* Back Button */}
            <Link to="/europarlament" className="inline-flex items-center gap-2 text-secondary hover:text-accent-blue transition-colors font-bold text-sm uppercase tracking-wide">
                <ArrowLeft size={20} />
                Wróć do listy
            </Link>

            {/* SECTION A: Identity Header */}
            <div className="bg-surface rounded-2xl border border-border-base p-8 shadow-sm relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    {/* Large Photo */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl pointer-events-none" />
                        <img
                            src={mp.photo_url}
                            alt={mp.full_name}
                            className="w-48 h-48 md:w-64 md:h-64 rounded-2xl object-cover object-top border-4 border-surface shadow-xl"
                            onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/256x256/E2E8F0/64748B?text=MP';
                            }}
                        />
                    </div>

                    {/* Identity Info */}
                    <div className="flex-1">
                        <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tight">
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
                            <span className="px-4 py-2 rounded-full bg-surface border border-border-base text-secondary text-[10px] font-black uppercase tracking-wider shadow-sm">
                                <MapPin size={14} className="inline mr-1" />
                                {mp.eu_group}
                            </span>

                            <span className="px-4 py-2 rounded-full bg-surface border border-border-base text-secondary text-[10px] font-black uppercase tracking-wider shadow-sm">
                                Parlament Europejski (2024-2029)
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION B: Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance */}
                <div className="bg-surface rounded-2xl border border-border-base p-6 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Frekwencja</p>
                    <div className="flex items-end gap-2 mb-4">
                        <span className={`text-5xl font-black tracking-tighter ${(mp.attendance_score || 0) >= 90 ? 'text-green-600 dark:text-green-400' :
                            (mp.attendance_score || 0) >= 75 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {mp.attendance_score ? mp.attendance_score.toFixed(1) : "0"}%
                        </span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-current transition-all duration-1000" style={{ width: `${mp.attendance_score || 0}%`, color: (mp.attendance_score || 0) >= 90 ? '#16a34a' : '#f59e0b' }} />
                    </div>
                </div>

                {/* Rebellion */}
                <div className="bg-surface rounded-2xl border border-border-base p-6 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Wskaźnik Niezależności</p>
                    <div className="flex items-end gap-2 mb-2">
                        <span className={`text-5xl font-black tracking-tighter ${(mp.rebellion_rate || 0) <= 5 ? 'text-green-600 dark:text-green-400' :
                            (mp.rebellion_rate || 0) <= 15 ? 'text-amber-500' : 'text-red-500'
                            }`}>
                            {mp.rebellion_rate ? mp.rebellion_rate.toFixed(1) : "0"}%
                        </span>
                    </div>
                    <p className="text-xs font-medium text-secondary opacity-60">Głosów niezgodnych z linią frakcji (delegacji PL).</p>
                </div>

                {/* Total Votes */}
                <div className="bg-surface rounded-2xl border border-border-base p-6 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Wszystkich Głosów</p>
                    <p className="text-5xl font-black text-primary tracking-tighter mb-2">
                        {mp.total_votes || 0}
                    </p>
                    <p className="text-xs font-medium text-secondary opacity-60">Wliczając nieobecności</p>
                </div>
            </div>

            {/* SECTION D: Voting History Timeline */}
            <div className="bg-surface rounded-2xl border border-border-base p-8 shadow-sm">
                <h2 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-accent-blue rounded-full"></div>
                    Ostatnie głosowania w PE
                </h2>

                {voteHistory.length > 0 ? (
                    <div className="space-y-4">
                        {voteHistory.map((item: any, index: number) => (
                            <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-4 border-b border-border-base/50 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors rounded-xl px-4 -mx-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{item.euro_votes?.date || 'Data nieznana'}</span>
                                        {item.euro_votes?.topic_tag && (
                                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20">
                                                {item.euro_votes.topic_tag}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-primary font-bold line-clamp-2 leading-tight">
                                        {item.euro_votes?.title || 'Głosowanie bez tytułu'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* MP Vote */}
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest w-fit border ${item.vote === 'For' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                                        item.vote === 'Against' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                                            item.vote === 'Abstain' ? 'bg-black/5 dark:bg-white/5 text-secondary border-border-base' :
                                                'bg-black/5 dark:bg-white/5 text-secondary border-border-base'
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
                    <p className="text-secondary font-medium">Brak zarejestrowanych głosowań dla tego posła w naszej bazie.</p>
                )}
            </div>
        </div>
    );
}

export default EuroMPProfile;
