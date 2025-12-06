import React, { useEffect, useState } from 'react';
// Force HMR update
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Search, User, FileText, ArrowRight, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import MpCard from '../components/MpCard';
import { MP } from '../api';

interface VoteResult {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    title_raw?: string;
    category: string;
    verdict: string;
}

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [mps, setMps] = useState<MP[]>([]);
    const [votes, setVotes] = useState<VoteResult[]>([]);
    const [speeches, setSpeeches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query) {
            performSearch(query);
        }
    }, [query]);

    const performSearch = async (searchQuery: string) => {
        setLoading(true);
        try {
            // 1. Search MPs
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

            // 2. Search Votes
            const searchWords = searchQuery.split(/\s+/).filter(w => w.length > 0);

            let votesQuery = supabase
                .from('votes')
                .select('*');

            // For each word, require it to be in title_clean OR title_raw
            searchWords.forEach(word => {
                votesQuery = votesQuery.or(`title_clean.ilike.%${word}%,title_raw.ilike.%${word}%`);
            });

            const { data: votesData } = await votesQuery
                .order('date', { ascending: false })
                .limit(6);

            if (votesData) setVotes(votesData);

            // 3. Search Speeches (NEW)
            let speechesQuery = supabase
                .from('speeches')
                .select('*');

            // For each word, require it to be in content
            searchWords.forEach(word => {
                speechesQuery = speechesQuery.ilike('content', `%${word}%`);
            });

            const { data: speechesData } = await speechesQuery
                .order('date', { ascending: false })
                .limit(3);

            if (speechesData) setSpeeches(speechesData);

        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-paper pt-32 pb-12 px-6 md:px-12">
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

                        {/* MPs Section */}
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
                                {mps.length === 5 && (
                                    <div className="mt-8 text-center">
                                        <Link to={`/poslowie?q=${query}`} className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors uppercase tracking-wide text-xs">
                                            Zobacz wszystkich posłów <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Votes Section */}
                        {votes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-neutral-200 pb-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-2xl font-bold">Głosowania</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {votes.map(vote => (
                                        <Link key={vote.id} to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`} className="group block bg-white rounded-2xl border border-slate-200 p-6 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 h-full flex flex-col justify-between relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                        Kadencja {vote.term === 9 ? 'IX' : 'X'}
                                                    </span>
                                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                        {vote.category || 'Głosowanie'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {new Date(vote.date).toLocaleDateString('pl-PL')}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug mb-4 line-clamp-3">
                                                    {cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                                                </h3>
                                            </div>

                                            <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-auto relative z-10">
                                                <div className={`flex items-center gap-2 text-sm font-bold ${vote.verdict === 'PRZYJĘTO' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {vote.verdict === 'PRZYJĘTO' ? (
                                                        <>
                                                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </div>
                                                            <span>Przyjęto</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                                                                <XCircle className="w-5 h-5" />
                                                            </div>
                                                            <span>Odrzucono</span>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                {votes.length === 6 && (
                                    <div className="mt-8 text-center">
                                        <Link to={`/glosowania?q=${query}`} className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors uppercase tracking-wide text-sm">
                                            Zobacz wszystkie głosowania <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Speeches Section */}
                        {speeches.length > 0 && (
                            <section>
                                <div className="flex items-center gap-3 mb-6 border-b border-neutral-200 pb-4">
                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                    <h2 className="text-2xl font-bold">Wypowiedzi</h2>
                                </div>
                                <div className="space-y-4">
                                    {speeches.map((speech: any) => (
                                        <div key={speech.id} className="p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                    Posiedzenie {speech.sitting} • {speech.date}
                                                </span>
                                            </div>
                                            <p className="text-slate-700 text-sm line-clamp-3 italic mb-3">
                                                "{speech.content}"
                                            </p>
                                            <Link to={`/wypowiedzi/${speech.id}`} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                                                Czytaj całość <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 text-center">
                                    <Link to={`/wypowiedzi?q=${query}`} className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 transition-colors uppercase tracking-wide text-sm">
                                        Przeszukaj wszystkie wypowiedzi <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </section>
                        )}

                        {mps.length === 0 && votes.length === 0 && speeches.length === 0 && (
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
