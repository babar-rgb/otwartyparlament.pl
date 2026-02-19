import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, Calendar, Search, X,
    Gavel, Stethoscope, BookOpen,
    TrendingUp, Leaf, Zap, Music,
    Globe, Building2, Briefcase, Heart,
    Landmark, Fingerprint, AlertTriangle,
    Eye, ShieldAlert
} from 'lucide-react';
import SEO from '../components/SEO';
import CommitteeHero from '../components/features/sejm/CommitteeHero';
import { useCommittees } from '../hooks/useCommittees';

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
    const { data: committees = [], isLoading: loading } = useCommittees();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const filteredCommittees = (committees as Committee[]).filter((c: Committee) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || c.committee_type === filterType;
        return matchesSearch && matchesType;
    });

    const getCommitteeIcon = (code: string, name: string) => {
        const n = name.toLowerCase();
        const c = code.toUpperCase();

        if (n.includes('obron') || c.includes('OBR') || n.includes('wewnetrz')) return ShieldAlert;
        if (n.includes('sprawiedliw') || n.includes('ustawodaw') || c.includes('SPC') || c.includes('UST')) return Gavel;
        if (n.includes('zdrow')) return Stethoscope;
        if (n.includes('edukacj') || n.includes('nauk') || n.includes('nauka') || c.includes('ENM')) return BookOpen;
        if (n.includes('gospodark') || n.includes('finans') || c.includes('GOS') || c.includes('FPB')) return TrendingUp;
        if (n.includes('srodowisk') || n.includes('klimat')) return Leaf;
        if (n.includes('energetyk') || n.includes('skarb')) return Zap;
        if (n.includes('kultur') || n.includes('media')) return Music;
        if (n.includes('zagraniczn') || n.includes('unii europejsk') || c.includes('SUE')) return Globe;
        if (n.includes('infrastruktur') || n.includes('cyfryzacj')) return Building2;
        if (n.includes('pracy') || n.includes('polityki spoleczn') || c.includes('PSR')) return Briefcase;
        if (n.includes('rodzin') || n.includes('dzieci')) return Heart;
        if (n.includes('sluzb specjaln')) return Eye;
        if (n.includes('etyki')) return Fingerprint;
        if (n.includes('petycji')) return Landmark;
        if (n.includes('sledcz')) return AlertTriangle;

        return Users;
    };

    const getCommitteeIconColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'stala': return 'text-accent-blue';
            case 'nadzwyczajna': return 'text-purple-500';
            case 'sledcza': return 'text-rose-500';
            default: return 'text-secondary';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-secondary text-sm font-medium tracking-wider uppercase">Ładowanie komisji...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page text-primary font-sans transition-all duration-500 pb-24">
            <SEO
                title="Komisje Sejmowe - Skład i Aktywność"
                description="Analiza prac komisji sejmowych. Zobacz składy, zaplanowane posiedzenia oraz statystyki aktywności poszczególnych komisji."
            />

            <CommitteeHero committeeCount={committees.length} />

            <div className="container mx-auto max-w-screen-2xl px-4 md:px-8 pt-12 space-y-16">
                {/* Filter & Search Section - Unified Style */}
                <div className="bg-surface p-6 rounded-[2rem] border border-border-base shadow-2xl backdrop-blur-xl">
                    <div className="relative group">
                        <div className="relative flex flex-col md:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full flex items-center gap-4">
                                <Search className="text-secondary transition-colors hidden md:block" size={24} />
                                <input
                                    type="text"
                                    placeholder="Szukaj komisji (np. 'Ustawodawcza')..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-slate-400 focus:outline-none py-2"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="p-2 text-secondary hover:text-primary transition-colors">
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                                {[
                                    { label: `Wszystkie (${committees.length})`, value: 'all' },
                                    { label: 'Stałe', value: 'stala' },
                                    { label: 'Nadzwyczajne', value: 'nadzwyczajna' },
                                    { label: 'Śledcze', value: 'sledcza' }
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFilterType(f.value)}
                                        className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${filterType === f.value
                                            ? 'bg-gradient-to-r from-slate-600 to-slate-800 text-white border-transparent shadow-lg shadow-slate-900/20'
                                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white hover:text-primary transition-colors'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-border-base pb-4">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-secondary">Składy Komisji</h2>
                        <div className="text-[10px] font-black uppercase text-secondary/40">{filteredCommittees.length} wyników</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCommittees.map((committee: Committee) => {
                            const Icon = getCommitteeIcon(committee.code, committee.name);
                            return (
                                <Link
                                    key={committee.code}
                                    to={`/komisje/${committee.code}`}
                                    className="group relative bg-surface rounded-[2rem] border border-white/5 p-8 transition-all hover:shadow-2xl hover:shadow-accent-blue/5 hover:-translate-y-1 overflow-hidden"
                                >
                                    {/* Decorative Background Icon */}
                                    <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-500 pointer-events-none group-hover:scale-110 group-hover:-rotate-12 transform-gpu">
                                        <Icon size={160} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className={`mb-4 ${getCommitteeIconColor(committee.committee_type)} opacity-80`}>
                                            <Icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-black text-primary mb-6 group-hover:text-accent-blue transition-colors line-clamp-2 leading-tight tracking-tight">
                                            {committee.name}
                                        </h3>
                                        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-secondary group-hover:text-primary transition-all">
                                                <Users size={14} className="text-accent-blue" />
                                                {committee.member_count} Posłów
                                            </span>
                                            <span className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-secondary group-hover:text-primary transition-all">
                                                <Calendar size={14} className="text-purple-500" />
                                                {committee.sitting_count} Posiedzeń
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
