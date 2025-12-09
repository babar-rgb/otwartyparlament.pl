import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, User, FileText, ArrowRight, MessageSquare, BookOpen, Zap } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import MpCard from '../components/MpCard';
import { MP } from '../api';

interface SearchResult {
    type: 'process' | 'vote' | 'speech' | 'interpellation';
    id: string;
    title: string;
    ux_category?: string;
    content_preview?: string;
    date: string;
    relevance: number;
}

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [mps, setMps] = useState<MP[]>([]);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            performSearch(query);
        }
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        setLoading(true);
        const expanded = searchParams.get('expanded');

        try {
            // 1. Search MPs (Always separate, keep simple fuzzy)
            const { data: mpsData } = await supabase
                .from('mps')
                .select('*')
                .ilike('name', `%${searchQuery}%`)
                .limit(5);

            if (mpsData) {
                const mappedMps: MP[] = mpsData.map(mp => ({
                    id: mp.id,
                    first_name: mp.name.split(' ')[0],
                    last_name: mp.name.split(' ').slice(1).join(' '),
                    club: mp.party,
                    district: mp.district,
                    photo_url: mp.photo_url,
                    attendanceRate: Math.round(mp.stats_attendance || 0),
                    active: mp.active,
                    rebelVotes: mp.stats_rebellion || 0
                }));
                setMps(mappedMps);
            }

            // 2. Unified Semantic Search
            let queryBuilder = supabase
                .from('view_search_all')
                .select('*');

            if (expanded) {
                // Semantic Search: Use expanded terms with OR logic + Heuristic Stemming
                // Polish morphology often changes the last 1-2 letters.
                // Rule: If word > 4 chars, trim last char and add :* prefix match.
                // Else just add :*
                const semanticQuery = expanded.split(',')
                    .map(s => {
                        // Split multi-word phrases (e.g. "ceny w sklepach")
                        const parts = s.trim().toLowerCase().split(/\s+/);

                        const processedParts = parts.map(word => {
                            // Heuristic stemming for each word
                            if (word.length > 4) {
                                return word.slice(0, -1) + ':*';
                            }
                            return word + ':*';
                        });

                        // Join with phrase operator <-> and wrap in parens if multi-word
                        if (processedParts.length > 1) {
                            return `(${processedParts.join(' <-> ')})`;
                        }
                        return processedParts[0];
                    })
                    .join(' | ');

                console.log("Semantic Query:", semanticQuery);
                queryBuilder = queryBuilder.textSearch('title', semanticQuery, { config: 'simple' });
            } else {
                // Standard Search: Websearch (handles quotes, minus, etc.)
                queryBuilder = queryBuilder.textSearch('title', searchQuery, { type: 'websearch', config: 'simple' });
            }

            const { data: searchData, error } = await queryBuilder
                .order('relevance', { ascending: false })
                .limit(30);

            if (error) throw error;
            if (searchData) setResults(searchData as SearchResult[]);

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
        <div className="min-h-screen bg-paper pt-32 pb-12 px-6 md:px-12 text-ink">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Header */}
                <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900">
                        Wyniki dla <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">"{query}"</span>
                    </h1>
                </div>

                {loading ? (
                    <div className="text-center py-24 text-ink-light text-lg">Przeszukiwanie archiwów Sejmu...</div>
                ) : (
                    <div className="space-y-16">

                        {/* 1. MPs Section */}
                        {mps.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-8 border-b border-neutral-200 pb-4">
                                    <User className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-3xl font-bold">Posłowie</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {mps.map(mp => (
                                        <MpCard key={mp.id} mp={mp} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 2. Processes (Laws) Section - NEW */}
                        {processes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-neutral-200 pb-4">
                                    <BookOpen className="w-6 h-6 text-amber-600" />
                                    <h2 className="text-2xl font-bold">Projekty Ustaw i Uchwał</h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {processes.map(proc => (
                                        <Link key={proc.id} to={`/projekty/${proc.id}`} className="block bg-white p-6 rounded-xl border border-amber-100 hover:border-amber-300 hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wide bg-amber-50 px-2 py-1 rounded mb-2 inline-block">
                                                        {proc.ux_category || 'Projekt'}
                                                    </span>
                                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                                        {cleanSejmTitle(proc.title)}
                                                    </h3>
                                                    {proc.content_preview && (
                                                        <p className="text-slate-600 mt-2 text-sm line-clamp-2">
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

                        {/* 3. Votes Section */}
                        {votes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-neutral-200 pb-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-2xl font-bold">Głosowania</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {votes.map(vote => (
                                        <Link key={vote.id} to={`/glosowanie/${vote.id}`} className="block bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg h-full flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                        {vote.ux_category || 'Głosowanie'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {new Date(vote.date).toLocaleDateString('pl-PL')}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-3">
                                                    {cleanSejmTitle(vote.title)}
                                                </h3>
                                            </div>
                                            <div className="flex justify-end">
                                                <ArrowRight className="w-5 h-5 text-slate-300" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 4. Speeches Section */}
                        {speeches.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-neutral-200 pb-4">
                                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                                    <h2 className="text-2xl font-bold">Wypowiedzi</h2>
                                </div>
                                <div className="space-y-4">
                                    {speeches.map((speech) => (
                                        <div key={speech.id} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                                            <p className="text-slate-700 text-sm line-clamp-3 italic mb-3">
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
                            <div className="text-center py-24 bg-white rounded-2xl border border-neutral-200">
                                <Search className="w-16 h-16 text-neutral-200 mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-ink mb-3">Brak wyników</h3>
                                <p className="text-ink-light max-w-md mx-auto">
                                    Nie znaleźliśmy nic dla zapytania "{query}". Spróbuj wpisać inne słowa kluczowe.
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
