import { useState, useEffect } from 'react';
import { fetchEuroMPs } from '../api';
import { Search, Globe, Users, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import Badge from '../components/ui/Badge';
import { getEuGroupStyle } from '../utils/theme';

// Helper for name formatting
const formatName = (name: string) => {
    return name
        .toLowerCase()
        .split(' ')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};


export default function Europarlament() {
    const [meps, setMeps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('All');

    useEffect(() => {
        const fetchMeps = async () => {
            try {
                const data = await fetchEuroMPs({ term: 10, active: true });
                setMeps(data);
            } catch (err) {
                console.error("Error fetching Euro MEPs:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeps();
    }, []);

    const groups = ['All', ...new Set(meps.map(m => m.eu_group).filter(Boolean))];

    const filteredMeps = meps.filter(m => {
        const matchesSearch = m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.national_party?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = selectedGroup === 'All' || m.eu_group === selectedGroup;
        return matchesSearch && matchesGroup;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page text-primary animate-fade-in pb-20 transition-colors duration-300">
            <SEO
                title="Europarlamentarzyści"
                description="Lista polskich posłów do Parlamentu Europejskiego. Sprawdź ich przynależność partyjną i aktywność."
                url="/europarlament"
            />

            {/* Hero Section */}
            <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base -mx-4 md:-mx-8 mb-12 bg-page">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-blue/10 text-accent-blue rounded-full border border-accent-blue/20 text-[10px] font-black uppercase tracking-widest mb-4">
                                <Globe size={12} />
                                Europejska Baza Danych v1.0
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                                Euro<span className="italic font-serif text-accent-blue/80">Parlament</span>
                            </h1>
                            <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                                Polscy reprezentanci w Parlamencie Europejskim. Przejrzysta lista europosłów, ich przynależność do frakcji oraz aktywność legislacyjna.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
                                        placeholder="Szukaj europosła (nazwisko, partia)..."
                                        className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-secondary/30 focus:outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Group Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 border-t border-border-base/50 pt-6">
                            {groups.map(g => (
                                <button
                                    key={g as string}
                                    onClick={() => setSelectedGroup(g as string)}
                                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${selectedGroup === g
                                        ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                                        : 'bg-page text-secondary border-border-base hover:bg-surface hover:text-primary'
                                        }`}
                                >
                                    {g as string === 'All' ? 'WSZYSTKIE FRAKCJE' : g as string}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMeps.map((mep, index) => (
                        <div
                            key={mep.id}
                            className="group bg-surface rounded-2xl border border-border-base overflow-hidden hover:shadow-2xl hover:shadow-accent-blue/5 hover:border-accent-blue/30 hover:-translate-y-1 transition-all duration-300 relative flex flex-col"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Status Indicator */}
                            <div className={`absolute top-0 inset-x-0 h-1 ${getEuGroupStyle(mep.eu_group)} opacity-50`} />

                            <div className="p-6 flex items-start gap-4">
                                <div className="relative w-20 h-20 flex-shrink-0">
                                    <div className="absolute inset-0 bg-page rounded-full animate-pulse" />
                                    <img
                                        src={mep.photo_url || `https://ui-avatars.com/api/?name=${mep.full_name}&background=random`}
                                        alt={mep.full_name}
                                        className="w-full h-full object-cover rounded-full border-2 border-border-base shadow-sm relative z-10 group-hover:border-accent-blue/50 transition-colors"
                                        loading="lazy"
                                    />
                                    <div className="absolute -bottom-1 -right-1 z-20">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm border border-surface ${getEuGroupStyle(mep.eu_group)}`}>
                                            <Globe size={10} />
                                        </div>
                                    </div>
                                </div>

                                <div className="min-w-0">
                                    <h3 className="font-bold text-lg text-primary leading-tight mb-2 group-hover:text-accent-blue transition-colors truncate">
                                        {formatName(mep.full_name)}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="party" party={mep.national_party} size="xs">
                                            {mep.national_party}
                                        </Badge>
                                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${getEuGroupStyle(mep.eu_group)} opacity-80`}>
                                            {mep.eu_group}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions / Footer */}
                            <div className="mt-auto p-4 pt-0 border-t border-transparent group-hover:border-border-base/50 transition-colors">
                                <a
                                    href={`/europarlament/${mep.id}`}
                                    className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-page text-secondary text-xs font-bold hover:bg-accent-blue/10 hover:text-accent-blue transition-colors group/btn"
                                >
                                    <span>Zobacz Profil</span>
                                    <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMeps.length === 0 && (
                    <div className="text-center py-20 bg-surface rounded-3xl border border-dashed border-border-base">
                        <Users className="mx-auto text-secondary/50 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-primary">Brak wyników</h3>
                        <p className="text-secondary">Nie znaleziono europosłów spełniających kryteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
