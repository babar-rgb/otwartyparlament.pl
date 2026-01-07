import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommittees } from '../api';
import { Users, Calendar, Search, X } from 'lucide-react';
import SEO from '../components/SEO';
import CommitteeHero from '../components/features/sejm/CommitteeHero';

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
        <div className="min-h-screen bg-page transition-colors duration-500 pb-16">
            <SEO
                title="Komisje Sejmowe"
                description="Lista wszystkich komisji sejmowych z informacjami o posiedzeniach, członkach i agendzie."
            />

            <CommitteeHero committeeCount={committees.length} />

            <div className="max-w-7xl mx-auto px-4 md:px-8">
                {/* Filter & Search Section - Unified Style */}
                <div className="bg-surface p-6 rounded-[2rem] border border-border-base shadow-2xl backdrop-blur-md -mt-8 mb-12 relative z-20">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative flex-1">
                                <div className="relative flex items-center gap-4">
                                    <Search className="text-secondary transition-colors" size={24} />
                                    <input
                                        type="text"
                                        placeholder="Szukaj komisji..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-secondary/20 focus:outline-none"
                                    />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="p-2 text-secondary hover:text-primary transition-colors">
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Committee Type Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 border-t border-border-base/50 pt-6">
                            {[
                                { label: 'WSZYSTKIE', value: 'all' },
                                { label: 'STAŁE', value: 'stala' },
                                { label: 'NADZWYCZAJNE', value: 'nadzwyczajna' },
                                { label: 'ŚLEDCZE', value: 'sledcza' }
                            ].map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilterType(f.value)}
                                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${filterType === f.value
                                        ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                                        : 'bg-surface text-secondary border-transparent hover:bg-hover hover:text-primary'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredCommittees.map((committee) => (
                        <Link
                            key={committee.code}
                            to={`/komisje/${committee.code}`}
                            className="bg-surface rounded-[var(--radius-card-md)] border border-border-base p-6 hover:border-accent-blue/50 hover:bg-hover transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1"
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
