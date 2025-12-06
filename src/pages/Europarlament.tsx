import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
import { EuroLogoGold } from '../components/EuroLogoGold';
import { useTerm } from '../context/TermContext';

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

const Europarlament: React.FC = () => {
    const { term } = useTerm();
    const [meps, setMeps] = useState<EuroMP[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [groupFilter, setGroupFilter] = useState<string>('All');

    useEffect(() => {
        fetchMeps();
    }, [term]);

    const fetchMeps = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('euro_meps')
            .select('*')
            .eq('term', term) // Filter by Term
            .eq('active', true)
            .order('full_name');

        if (error) {
            console.error('Error fetching MEPs:', error);
            setMeps([]);
        } else {
            setMeps(data || []);
        }
        setLoading(false);
    };

    // Filter Logic
    const filteredMeps = meps.filter(mep => {
        const matchesSearch = mep.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            mep.national_party?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = groupFilter === 'All' || mep.national_party === groupFilter;
        return matchesSearch && matchesGroup;
    });

    const uniqueParties = Array.from(new Set(meps.map(m => m.national_party))).filter(p => p && p !== 'Brak danych').sort();

    // Group Colors Helper
    const getGroupColor = (group: string) => {
        if (!group) return 'bg-gray-100 text-gray-800';
        if (group.includes('EPP')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        if (group.includes('S&D')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        if (group.includes('Renew')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
        if (group.includes('ECR')) return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
        if (group.includes('Greens')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
        if (group.includes('Left')) return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300';
        if (group.includes('Patriots')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    };

    return (
        <div className="min-h-screen bg-paper dark:bg-[#1e1b4b] text-neutral-900 dark:text-white font-sans transition-colors duration-300">
            {/* Hero Section */}
            <div className="bg-white dark:bg-[#0f0c29] border-b border-neutral-200 dark:border-indigo-900/50 pt-28 pb-12 px-6 md:pt-32">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                                <EuroLogoGold className="w-12 h-12" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-[#D6B55E] dark:to-[#F3E5AB]">
                                    Reprezentacja w Europie
                                </span>
                            </h1>
                            <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                Polscy posłowie w Parlamencie Europejskim (Kadencja {term === 10 ? '2024-2029' : '2019-2024'})
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Szukaj posła..."
                                    className="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-indigo-800 bg-white dark:bg-[#24243e] outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mt-8 flex flex-wrap gap-2 text-sm">
                        <button
                            onClick={() => setGroupFilter('All')}
                            className={`px-4 py-1.5 rounded-full transition-all border ${groupFilter === 'All'
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-[#24243e] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-indigo-800 hover:border-blue-300'}`}
                        >
                            Wszystkie Partie
                        </button>
                        {uniqueParties.map(party => (
                            <button
                                key={party}
                                onClick={() => setGroupFilter(party)}
                                className={`px-4 py-1.5 rounded-full transition-all border ${groupFilter === party
                                    ? `${getPartyStyle(party)} text-white border-transparent shadow-md`
                                    : 'bg-white dark:bg-[#24243e] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-indigo-800 hover:border-blue-300'}`}
                            >
                                {party}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Votes Section */}
            <EuroVotesList />

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                    Polscy Deputowani
                </h2>
                {loading ? (
                    <div className="text-center py-20 text-neutral-500">Ładowanie danych z Parlamentu Europejskiego...</div>
                ) : (
                    <>
                        <div className="mb-6 text-neutral-500 dark:text-neutral-400 text-sm">
                            Znaleziono {filteredMeps.length} posłów
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredMeps.map(mep => (
                                <Link
                                    to={`/europarlament/${mep.id}`}
                                    key={mep.id}
                                    className="group bg-white dark:bg-[#24243e] border border-neutral-200 dark:border-indigo-900/50 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col block"
                                >
                                    {/* Image Area */}
                                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-[#1a1a2e]">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 z-10" />
                                        <img
                                            src={mep.photo_url}
                                            alt={mep.full_name}
                                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x500?text=Brak+Zdjęcia';
                                            }}
                                        />

                                        {/* Badges on Image */}
                                        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-2">
                                            <h3 className="text-xl font-bold text-white drop-shadow-md leading-tight">
                                                {mep.full_name}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {/* National Party Badge */}
                                                <span className={`px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm shadow-sm border border-white/20 text-white ${getPartyStyle(mep.national_party)}`}>
                                                    {mep.national_party !== 'Brak danych' ? mep.national_party : 'Polska'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-4 flex-grow flex flex-col justify-end bg-white dark:bg-[#24243e]">
                                        <div className="space-y-3">
                                            {/* EU Group Badge */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Frakcja UE</span>
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getGroupColor(mep.eu_group)}`}>
                                                    {mep.eu_group}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

import { getPartyStyle } from '../utils/theme';

const EuroVotesList = () => {
    const [votes, setVotes] = useState<any[]>([]);
    const { term } = useTerm();

    useEffect(() => {
        const fetchVotes = async () => {
            const { data } = await supabase
                .from('euro_votes')
                .select('*')
                .eq('term', term)
                .order('date', { ascending: false })
                .limit(6);
            if (data) setVotes(data);
        };
        fetchVotes();
    }, [term]);

    if (votes.length === 0) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <div className="w-1 h-8 bg-amber-500 rounded-full"></div>
                Ostatnie Kluczowe Głosowania
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {votes.map(v => (
                    <Link
                        to={`/europarlament/glosowanie/${v.id}`}
                        key={v.id}
                        className="bg-white dark:bg-[#24243e] p-6 rounded-2xl border border-neutral-200 dark:border-indigo-900/50 shadow-sm hover:border-amber-400 dark:hover:border-amber-500/50 transition-all hover:shadow-md block group"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold bg-neutral-100 dark:bg-white/5 px-2 py-1 rounded text-neutral-500 uppercase tracking-wide">
                                {new Date(v.date).toLocaleDateString('pl-PL')}
                            </span>
                            <span className="text-xs text-neutral-400 group-hover:text-amber-500 transition-colors">ID: {v.id?.split('-').pop()}</span>
                        </div>
                        <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {v.title}
                        </h3>
                        {/* Placeholder for results if we had them summary */}
                        <div className="mt-3 flex gap-2">
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                                Wniosek Legislacyjny
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};


export default Europarlament;
