import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, Calendar, Building2, ArrowRight, Video, Search } from 'lucide-react';
import SEO from '../components/SEO';

interface Committee {
    id: number;
    code: string;
    name: string;
    name_genitive: string;
    committee_type: string;
    member_count?: number;
    sitting_count?: number;
    last_sitting?: string;
}

export default function Komisje() {
    const [committees, setCommittees] = useState<Committee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const loadCommittees = async () => {
            try {
                // Fetch committees
                const { data: commData, error: commError } = await supabase
                    .from('committees')
                    .select('*')
                    .order('name');

                if (commError) throw commError;

                // Fetch member counts
                const { data: memberCounts } = await supabase
                    .from('committee_members')
                    .select('committee_code');

                // Fetch sitting counts and latest date
                const { data: sittingData } = await supabase
                    .from('committee_sittings')
                    .select('committee_code, date')
                    .order('date', { ascending: false });

                // Count members per committee
                const memberCountMap: Record<string, number> = {};
                if (memberCounts) {
                    for (const m of memberCounts) {
                        memberCountMap[m.committee_code] = (memberCountMap[m.committee_code] || 0) + 1;
                    }
                }

                // Count sittings and get latest date per committee
                const sittingCountMap: Record<string, number> = {};
                const lastSittingMap: Record<string, string> = {};
                if (sittingData) {
                    for (const s of sittingData) {
                        sittingCountMap[s.committee_code] = (sittingCountMap[s.committee_code] || 0) + 1;
                        if (!lastSittingMap[s.committee_code]) {
                            lastSittingMap[s.committee_code] = s.date;
                        }
                    }
                }

                // Combine data
                const enrichedCommittees = commData.map((c: Committee) => ({
                    ...c,
                    member_count: memberCountMap[c.code] || 0,
                    sitting_count: sittingCountMap[c.code] || 0,
                    last_sitting: lastSittingMap[c.code],
                }));

                setCommittees(enrichedCommittees);
            } catch (error) {
                console.error('Error loading committees:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCommittees();
    }, []);

    const filteredCommittees = committees.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || c.committee_type === filterType;
        return matchesSearch && matchesType;
    });



    const totalSittings = committees.reduce((sum, c) => sum + (c.sitting_count || 0), 0);
    const totalMembers = committees.reduce((sum, c) => sum + (c.member_count || 0), 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#06060c] flex items-center justify-center">
                <div className="text-white/40 text-sm font-medium tracking-wider uppercase">Ładowanie komisji...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06060c] pt-24 pb-16 px-4 md:px-8">
            <SEO
                title="Komisje Sejmowe"
                description="Lista wszystkich komisji sejmowych z informacjami o posiedzeniach, członkach i agendzie."
            />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                        Komisje Sejmowe
                    </h1>
                    <p className="text-lg text-white/50 max-w-2xl">
                        Komisje to miejsce, gdzie powstaje prawo — 80% pracy parlamentarnej odbywa się tutaj.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="bg-[#111126] border border-white/5 rounded-2xl p-6 text-center">
                        <div className="text-3xl font-bold text-blue-400">{committees.length}</div>
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Komisji</div>
                    </div>
                    <div className="bg-[#111126] border border-white/5 rounded-2xl p-6 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{totalSittings.toLocaleString()}</div>
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Posiedzeń</div>
                    </div>
                    <div className="bg-[#111126] border border-white/5 rounded-2xl p-6 text-center">
                        <div className="text-3xl font-bold text-purple-400">{totalMembers}</div>
                        <div className="text-xs font-bold text-white/30 uppercase tracking-widest mt-1">Członkostw</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder="Szukaj komisji..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#111126] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterType === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            Wszystkie
                        </button>
                        <button
                            onClick={() => setFilterType('STANDING')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterType === 'STANDING'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            Stałe
                        </button>
                        <button
                            onClick={() => setFilterType('EXTRAORDINARY')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterType === 'EXTRAORDINARY'
                                ? 'bg-amber-600 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            Nadzwyczajne
                        </button>
                        <button
                            onClick={() => setFilterType('INVESTIGATIVE')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${filterType === 'INVESTIGATIVE'
                                ? 'bg-rose-600 text-white'
                                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            Śledcze
                        </button>
                    </div>
                </div>

                {/* Committee Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCommittees.map((committee) => (
                        <Link
                            key={committee.code}
                            to={`/komisje/${committee.code}`}
                            className="bg-[#111126] rounded-2xl border border-white/5 p-6 hover:border-white/20 hover:bg-[#16162d] transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Building2 size={20} className="text-blue-400" />
                                </div>
                                <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-1 rounded-full uppercase tracking-widest">
                                    {committee.code}
                                </span>
                            </div>

                            <h3 className="font-bold text-white mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                {committee.name}
                            </h3>

                            <div className="flex flex-wrap gap-4 text-sm text-white/40">
                                <div className="flex items-center gap-1.5">
                                    <Users size={14} />
                                    <span>{committee.member_count || 0} członków</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    <span>{committee.sitting_count || 0} posiedzeń</span>
                                </div>
                            </div>

                            {committee.last_sitting && (
                                <div className="mt-4 text-xs text-white/20 flex items-center gap-1">
                                    <Video size={12} />
                                    Ostatnie: {new Date(committee.last_sitting).toLocaleDateString('pl-PL')}
                                </div>
                            )}

                            <div className="mt-4 flex items-center text-blue-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                                Zobacz szczegóły <ArrowRight size={14} className="ml-1" />
                            </div>
                        </Link>
                    ))}
                </div>

                {filteredCommittees.length === 0 && (
                    <div className="text-center py-16 text-white/40">
                        Nie znaleziono komisji pasujących do kryteriów wyszukiwania.
                    </div>
                )}
            </div>
        </div>
    );
}
