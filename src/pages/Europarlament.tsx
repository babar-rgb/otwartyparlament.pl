import { useState, useEffect } from 'react';
import { fetchEuroMPs } from '../api';
import { Search, Globe, Users, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';

export default function Europarlament() {
    const [meps, setMeps] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('All');

    useEffect(() => {
        const fetchMeps = async () => {
            try {
                const data = await fetchEuroMPs({ term: 9, active: true });
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <SEO
                title="Europarlamentarzyści"
                description="Lista polskich posłów do Parlamentu Europejskiego. Sprawdź ich przynależność partyjną i aktywność."
                url="/europarlament"
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Europarlament</h1>
                    <p className="text-slate-600">Polscy reprezentanci w Parlamencie Europejskim (kadencja 2019-2024)</p>
                </div>

                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Szukaj posła lub partii..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                        {groups.map(g => (
                            <option key={g as string} value={g as string}>{g as string === 'All' ? 'Wszystkie grupy' : g as string}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredMeps.map((mep) => (
                    <div key={mep.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                        <div className="aspect-square relative overflow-hidden bg-slate-100">
                            <img
                                src={mep.photo_url || `https://ui-avatars.com/api/?name=${mep.full_name}&background=random`}
                                alt={mep.full_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black border border-slate-200 shadow-sm">
                                EURO MP
                            </div>
                        </div>

                        <div className="p-5 space-y-3">
                            <div>
                                <h3 className="font-extrabold text-slate-900 leading-tight mb-1">{mep.full_name}</h3>
                                <p className="text-sm font-bold text-blue-600">{mep.national_party}</p>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Globe size={14} className="text-slate-400" />
                                    {mep.eu_group}
                                </div>
                                <Users size={14} className="text-slate-400" />
                            </div>

                            <div className="pt-2">
                                <a
                                    href={`/europarlament/${mep.id}`}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                                >
                                    Profil <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
