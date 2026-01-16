import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, User, FileText, ArrowRight, MessageSquare, BookOpen, Zap } from 'lucide-react';
import { unifiedSearch } from '../api';
import { cleanSejmTitle } from '../utils/titleFormatter';
import MpCard from '../components/features/sejm/MpCard';
import { MP } from '../api';

interface SearchResult {
    type: 'process' | 'vote' | 'speech' | 'interpellation';
    id: string;
    title: string;
    ux_category?: string;
    content_preview?: string;
    date: string;
    relevance: number;
    term?: number;
}

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [mps, setMps] = useState<MP[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedTerm, setSelectedTerm] = useState<string>('10');
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Cache
    const searchCache = React.useRef<Record<string, any>>({});

    useEffect(() => {
        if (query) {
            performSearch(query, selectedTerm, selectedType);
        }
    }, [query, selectedTerm, selectedType]);

    const performSearch = async (q: string, term: string, type: string | null) => {
        const cacheKey = `${q}-${term}-${type || 'all'}`;

        // Check cache
        if (searchCache.current[cacheKey]) {
            const data = searchCache.current[cacheKey];
            const mpResults = data.filter((r: any) => r.type === 'mp').map((r: any) => r.data);
            const otherResults = data.filter((r: any) => r.type !== 'mp');
            setMps(mpResults);
            setResults(otherResults);
            return;
        }

        setLoading(true);
        const expanded = searchParams.get('expanded') || undefined;

        try {
            const data = await unifiedSearch({
                q,
                period: term !== 'all' ? term : undefined,
                type: type || undefined,
                expanded
            });

            // Update Cache
            searchCache.current[cacheKey] = data;

            // Separate MPs from other results
            const mpResults = data.filter((r: any) => r.type === 'mp').map((r: any) => r.data);
            const otherResults = data.filter((r: any) => r.type !== 'mp');

            setMps(mpResults);
            setResults(otherResults);

        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Grouping results for UI
    const processes = results.filter(r => r.type === 'process');
    const votes = results.filter(r => r.type === 'vote');
    const speeches = results.filter(r => r.type === 'speech');

    return (
        <div className="min-h-screen bg-page pt-32 pb-12 px-4 md:px-8 text-primary">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-primary">
                        Wyniki dla <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">"{query}"</span>
                    </h1>

                    {/* Filter Controls */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface p-4 rounded-xl border border-border-base mt-8">
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                            {[
                                { id: null, label: 'Wszystko' },
                                { id: 'vote', label: 'Głosowania' },
                                { id: 'process', label: 'Projekty' },
                                { id: 'speech', label: 'Wypowiedzi' },
                                { id: 'mp', label: 'Posłowie' },
                            ].map(type => (
                                <button
                                    key={type.id || 'all'}
                                    onClick={() => setSelectedType(type.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${selectedType === type.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-background hover:bg-surface-hover text-secondary border border-border-base'
                                        }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <span className="text-sm font-medium text-secondary whitespace-nowrap">Kadencja:</span>
                            <select
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="bg-background border border-border-base text-primary text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            >
                                <option value="10">10. Kadencja (2023-)</option>
                                <option value="9">9. Kadencja (2019-2023)</option>
                                <option value="all">Wszystkie</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-24 text-secondary text-lg font-medium animate-pulse">Przeszukiwanie bazy danych Sejmu...</div>
                ) : (
                    <div className="space-y-16">

                        {/* 1. MPs Section */}
                        {mps.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8 border-b border-border-base pb-4">
                                    <User className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-3xl font-black text-primary">Posłowie</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {mps.map(mp => (
                                        <MpCard key={mp.id} mp={mp} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Votes Section - Prioritized */}
                        {votes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-border-base pb-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-2xl font-bold text-primary">Głosowania</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {votes.map(vote => (
                                        <Link key={vote.id} to={`/glosowanie/${vote.id}`} className="block bg-surface rounded-2xl border border-border-base p-6 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-lg h-full flex flex-col justify-between group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                                        {vote.ux_category || 'Głosowanie'}
                                                    </span>
                                                    {vote.term && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-border-base bg-surface text-secondary">
                                                            {vote.term}. Kadencja
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-secondary font-bold uppercase tracking-tight">
                                                        {new Date(vote.date).toLocaleDateString('pl-PL')}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-primary mb-4 line-clamp-3 group-hover:text-blue-600 transition-colors">
                                                    {cleanSejmTitle(vote.title)}
                                                </h3>
                                            </div>
                                            <div className="flex justify-end">
                                                <ArrowRight className="w-5 h-5 text-secondary opacity-30 group-hover:opacity-100 group-hover:text-blue-500 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 3. Processes (Laws) Section */}
                        {processes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-border-base pb-4">
                                    <BookOpen className="w-6 h-6 text-amber-600" />
                                    <h2 className="text-2xl font-bold text-primary">Projekty Ustaw i Uchwał</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {processes.map(proc => (
                                        <Link key={proc.id} to={`/projekty/${proc.id}`} className="block bg-surface p-6 rounded-xl border border-border-base hover:border-amber-500/30 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex gap-2 mb-3">
                                                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded inline-block">
                                                            {proc.ux_category || 'Projekt'}
                                                        </span>
                                                        {proc.term && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-border-base bg-surface text-secondary">
                                                                {proc.term}. Kadencja
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold text-primary group-hover:text-amber-600 transition-colors">
                                                        {cleanSejmTitle(proc.title)}
                                                    </h3>
                                                    {proc.content_preview && (
                                                        <p className="text-secondary mt-2 text-sm line-clamp-2">
                                                            {proc.content_preview}
                                                        </p>
                                                    )}
                                                </div>
                                                <Zap className="text-amber-300 group-hover:text-amber-500 transition" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 4. Speeches Section */}
                        {speeches.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-border-base pb-4">
                                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                                    <h2 className="text-2xl font-bold text-primary">Wypowiedzi</h2>
                                </div>
                                <div className="space-y-4">
                                    {speeches.map((speech) => (
                                        <div key={speech.id} className="p-6 bg-surface rounded-xl border border-border-base hover:border-indigo-500/30 transition-colors relative group">
                                            {speech.term && (
                                                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border border-border-base bg-surface text-secondary">
                                                    {speech.term}. Kadencja
                                                </span>
                                            )}
                                            <p className="text-secondary text-sm line-clamp-3 italic mb-4 group-hover:text-primary transition-colors">
                                                "{speech.content_preview}..."
                                            </p>
                                            <Link to={`/wypowiedzi/${speech.id}`} className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                Czytaj całość <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {mps.length === 0 && results.length === 0 && (
                            <div className="text-center py-24 bg-surface rounded-2xl border border-border-base shadow-sm">
                                <Search className="w-16 h-16 text-secondary opacity-20 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-primary mb-3">Brak wyników</h3>
                                <p className="text-secondary max-w-md mx-auto">
                                    Nie znaleźliśmy nic dla zapytania <span className="text-primary font-bold">"{query}"</span>. Spróbuj wpisać inne słowa kluczowe.
                                </p>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
