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

    const committeeTypes = [...new Set(committees.map(c => c.committee_type).filter(Boolean))];

    const totalSittings = committees.reduce((sum, c) => sum + (c.sitting_count || 0), 0);
    const totalMembers = committees.reduce((sum, c) => sum + (c.member_count || 0), 0);

    if (loading) {
        return (
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-48"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-40 bg-slate-200 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-24 pb-12">
            <SEO
                title="Komisje Sejmowe"
                description="Lista wszystkich komisji sejmowych z informacjami o posiedzeniach, członkach i agendzie."
            />

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Komisje Sejmowe
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Komisje to miejsce, gdzie powstaje prawo — 80% pracy parlamentarnej odbywa się tutaj.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{committees.length}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Komisji</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{totalSittings.toLocaleString()}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Posiedzeń</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{totalMembers}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Członkostw</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Szukaj komisji..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                    <option value="all">Wszystkie typy</option>
                    {committeeTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            {/* Committee Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCommittees.map((committee) => (
                    <Link
                        key={committee.code}
                        to={`/komisje/${committee.code}`}
                        className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-5 hover:border-blue-300 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Building2 size={20} className="text-blue-600" />
                            </div>
                            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                {committee.code}
                            </span>
                        </div>

                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {committee.name}
                        </h3>

                        <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                                <Users size={14} />
                                <span>{committee.member_count || 0} członków</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{committee.sitting_count || 0} posiedzeń</span>
                            </div>
                        </div>

                        {committee.last_sitting && (
                            <div className="mt-3 text-xs text-slate-500 flex items-center gap-1">
                                <Video size={12} />
                                Ostatnie: {new Date(committee.last_sitting).toLocaleDateString('pl-PL')}
                            </div>
                        )}

                        <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Zobacz szczegóły <ArrowRight size={14} className="ml-1" />
                        </div>
                    </Link>
                ))}
            </div>

            {filteredCommittees.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    Nie znaleziono komisji pasujących do kryteriów wyszukiwania.
                </div>
            )}
        </div>
    );
}
