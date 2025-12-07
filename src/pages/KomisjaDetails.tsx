import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Users, Calendar, Video, MapPin, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

interface Committee {
    id: number;
    code: string;
    name: string;
    name_genitive: string;
    committee_type: string;
    phone: string;
}

interface CommitteeMember {
    mp_id: number;
    function: string;
    mps: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
        slug: string;
    };
}

interface CommitteeSitting {
    id: number;
    sitting_number: number;
    date: string;
    start_time: string;
    end_time: string;
    room: string;
    status: string;
    is_remote: boolean;
    is_closed: boolean;
    video_url: string;
    agenda: any[];
}

export default function KomisjaDetails() {
    const { code } = useParams();
    const [committee, setCommittee] = useState<Committee | null>(null);
    const [members, setMembers] = useState<CommitteeMember[]>([]);
    const [sittings, setSittings] = useState<CommitteeSitting[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSitting, setExpandedSitting] = useState<number | null>(null);
    const [showAllMembers, setShowAllMembers] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!code) return;

            try {
                // Fetch committee
                const { data: commData, error: commError } = await supabase
                    .from('committees')
                    .select('*')
                    .eq('code', code)
                    .single();

                if (commError) throw commError;
                setCommittee(commData);

                // Fetch members
                const { data: memberData } = await supabase
                    .from('committee_members')
                    .select('mp_id, function')
                    .eq('committee_code', code);

                if (memberData && memberData.length > 0) {
                    // Fetch MP details separately
                    const mpIds = memberData.map(m => m.mp_id);
                    const { data: mpsData } = await supabase
                        .from('mps')
                        .select('id, name, party, photo_url, slug')
                        .in('id', mpIds);

                    // Join the data
                    const mpsMap = new Map(mpsData?.map(mp => [mp.id, mp]) || []);
                    const enrichedMembers = memberData.map(m => ({
                        ...m,
                        mps: mpsMap.get(m.mp_id) || null
                    }));
                    setMembers(enrichedMembers as CommitteeMember[]);
                }

                // Fetch sittings
                const { data: sittingData } = await supabase
                    .from('committee_sittings')
                    .select('*')
                    .eq('committee_code', code)
                    .order('date', { ascending: false })
                    .limit(20);

                if (sittingData) {
                    setSittings(sittingData);
                }
            } catch (error) {
                console.error('Error loading committee:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [code]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-64"></div>
                    <div className="h-48 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!committee) {
        return (
            <div className="container mx-auto px-4 pt-24 pb-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Komisja nie znaleziona</h1>
                <Link to="/komisje" className="text-blue-600 hover:underline">
                    Wróć do listy komisji
                </Link>
            </div>
        );
    }

    // Sort members by function (przewodniczący first)
    const sortedMembers = [...members].sort((a, b) => {
        const order = ['przewodniczący', 'wiceprzewodniczący', 'sekretarz', 'członek'];
        const aIdx = order.findIndex(o => a.function?.toLowerCase().includes(o));
        const bIdx = order.findIndex(o => b.function?.toLowerCase().includes(o));
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    const displayedMembers = showAllMembers ? sortedMembers : sortedMembers.slice(0, 8);

    const toggleSitting = (id: number) => {
        setExpandedSitting(expandedSitting === id ? null : id);
    };

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
            <SEO
                title={committee.name}
                description={`Szczegóły komisji sejmowej: ${committee.name}. Skład, posiedzenia i agenda.`}
            />

            {/* Back button */}
            <Link
                to="/komisje"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
            >
                <ArrowLeft size={18} />
                Wróć do listy komisji
            </Link>

            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <span className="text-sm font-mono text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                            {committee.code}
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                            {committee.name}
                        </h1>
                        {committee.committee_type && (
                            <span className="inline-block mt-2 text-sm text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                {committee.committee_type}
                            </span>
                        )}
                    </div>
                    <div className="text-right text-sm text-slate-500">
                        <div className="flex items-center gap-1 justify-end">
                            <Users size={14} />
                            {members.length} członków
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-1">
                            <Calendar size={14} />
                            {sittings.length} posiedzeń
                        </div>
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6 mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Skład Komisji
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {displayedMembers.filter(m => m.mps).map((member) => (
                        <Link
                            key={member.mp_id}
                            to={`/poslowie/${member.mps?.slug || member.mps?.id || member.mp_id}`}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-blue-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <img
                                src={member.mps?.photo_url || `https://api.sejm.gov.pl/sejm/term10/MP/${member.mp_id}/photo`}
                                alt={member.mps?.name || 'MP'}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://via.placeholder.com/40';
                                }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 truncate text-sm">
                                    {member.mps?.name || 'Nieznany'}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    {member.function || member.mps?.party || ''}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {members.length > 8 && (
                    <button
                        onClick={() => setShowAllMembers(!showAllMembers)}
                        className="mt-4 w-full py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                        {showAllMembers ? 'Pokaż mniej' : `Pokaż wszystkich (${members.length})`}
                    </button>
                )}
            </div>

            {/* Sittings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    Ostatnie Posiedzenia
                </h2>

                <div className="space-y-3">
                    {sittings.map((sitting) => (
                        <Link
                            key={sitting.id}
                            to={`/komisje/${code}/posiedzenie/${sitting.id}`}
                            className="block border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
                        >
                            <div className="w-full p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                            {sitting.sitting_number}
                                        </div>
                                        <div className="text-xs text-slate-500">posiedzenie</div>
                                    </div>
                                    <div>
                                        <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                            {new Date(sitting.date).toLocaleDateString('pl-PL', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                            {sitting.room && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={12} />
                                                    {sitting.room}
                                                </span>
                                            )}
                                            {sitting.is_remote && (
                                                <span className="text-blue-600">Zdalne</span>
                                            )}
                                            {sitting.video_url && (
                                                <span className="flex items-center gap-1 text-red-600">
                                                    <Video size={12} />
                                                    Video
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded ${sitting.status === 'FINISHED' || sitting.status === 'zakończone'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        }`}>
                                        {sitting.status === 'FINISHED' ? 'Zakończone' : sitting.status || 'Planowane'}
                                    </span>
                                    <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {sittings.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                        Brak danych o posiedzeniach tej komisji.
                    </div>
                )}

                {sittings.length >= 20 && (
                    <div className="mt-4 text-center text-sm text-slate-500">
                        Pokazano 20 ostatnich posiedzeń
                    </div>
                )}
            </div>
        </div>
    );
}

