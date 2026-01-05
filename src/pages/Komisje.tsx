import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommittees } from '../api';
import { Users, Calendar, Search } from 'lucide-react';
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
    const [filterType] = useState<string>('all');

    useEffect(() => {
        const loadCommittees = async () => {
            try {
                const commData = await fetchCommittees();
                // For member counts and sittings, we'd ideally have an endpoint or get it from committee details
                // For now, let's keep them as placeholders or map them if available in the response
                setCommittees(commData.map((c: any) => ({
                    ...c,
                    member_count: c.member_count || 0,
                    sitting_count: c.sitting_count || 0
                })));
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
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-secondary text-sm font-medium tracking-wider uppercase">Ładowanie komisji...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page pt-24 pb-16 px-4 md:px-8">
            <SEO
                title="Komisje Sejmowe"
                description="Lista wszystkich komisji sejmowych z informacjami o posiedzeniach, członkach i agendzie."
            />

            <div className="max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 tracking-tight">
                        Komisje Sejmowe
                    </h1>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="bg-surface border border-border-base rounded-2xl p-6 text-center shadow-sm">
                        <div className="text-3xl font-bold text-blue-400">{committees.length}</div>
                        <div className="text-xs font-bold text-secondary opacity-40 uppercase tracking-widest mt-1">Komisji</div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 mb-8">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-30" />
                        <input
                            type="text"
                            placeholder="Szukaj komisji..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface border border-border-base text-primary placeholder:text-secondary focus:outline-none focus:border-blue-500/50 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCommittees.map((committee) => (
                        <Link
                            key={committee.code}
                            to={`/komisje/${committee.code}`}
                            className="bg-surface rounded-2xl border border-border-base p-6 hover:border-accent-blue/50 hover:bg-slate-50 dark:hover:bg-[#16162d] transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1"
                        >
                            <h3 className="font-bold text-primary mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                {committee.name}
                            </h3>
                            <div className="flex gap-4 text-xs font-bold text-secondary uppercase opacity-60">
                                <span className="flex items-center gap-1"><Users size={12} /> {committee.member_count}</span>
                                <span className="flex items-center gap-1"><Calendar size={12} /> {committee.sitting_count}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
