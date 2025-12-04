import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Calendar, User } from 'lucide-react';

interface Speech {
    id: number;
    mp_id: number | null;
    sitting: number;
    date: string;
    speaker_name: string;
    content: string;
    topic: string;
    mp?: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
    };
}

export default function SpeechesList() {
    const [query, setQuery] = useState('');
    const [speeches, setSpeeches] = useState<Speech[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSpeeches, setRecentSpeeches] = useState<Speech[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Load recent speeches on mount
    useEffect(() => {
        fetchRecentSpeeches();
        fetchTotalCount();
    }, []);

    const fetchTotalCount = async () => {
        const { count } = await supabase
            .from('speeches')
            .select('*', { count: 'exact', head: true });
        if (count) setTotalCount(count);
    };

    const fetchRecentSpeeches = async () => {
        try {
            const { data, error } = await supabase
                .from('speeches')
                .select(`
          *,
          mp:mps(id, name, party, photo_url)
        `)
                .order('date', { ascending: false })
                .order('id', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRecentSpeeches(data || []);
        } catch (err) {
            console.error('Error fetching recent speeches:', err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            // Use Supabase full text search if configured, or simple ilike for now
            // Ideally we should have a tsvector column, but for MVP ilike is okay for small datasets
            const { data, error } = await supabase
                .from('speeches')
                .select(`
          *,
          mp:mps(id, name, party, photo_url)
        `)
                .ilike('content', `%${query}%`)
                .order('date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSpeeches(data || []);
        } catch (err) {
            console.error('Error searching speeches:', err);
        } finally {
            setLoading(false);
        }
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text.slice(0, 300) + '...';

        // Escape regex special characters
        const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeHighlight})`, 'gi');

        // Find first match
        const match = regex.exec(text);

        if (!match) {
            // Fallback if no match found (e.g. search logic differs from regex)
            return text.slice(0, 300) + '...';
        }

        const matchIndex = match.index;
        const matchLength = match[0].length;

        // Calculate snippet window
        const contextBefore = 60;
        const contextAfter = 240;

        let start = Math.max(0, matchIndex - contextBefore);
        let end = Math.min(text.length, matchIndex + matchLength + contextAfter);

        // Adjust start to beginning of a word if possible
        if (start > 0) {
            const spaceIndex = text.lastIndexOf(' ', start + 10);
            if (spaceIndex !== -1 && spaceIndex < matchIndex) {
                start = spaceIndex + 1;
            }
        }

        let snippet = text.slice(start, end);

        // Highlight all occurrences in the snippet
        snippet = snippet.replace(regex, (m) => `<mark class="bg-yellow-200 font-bold rounded px-1">${m}</mark>`);

        return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-24 pb-12 px-4 animate-fade-in">

            {/* Header & Search */}
            <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900">
                    Wyszukiwarka Wypowiedzi
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Przeszukaj <strong>{totalCount.toLocaleString()}</strong> stenogramów z posiedzeń Sejmu. Sprawdź, co dokładnie mówili posłowie.
                </p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
                    <input
                        type="text"
                        placeholder="Wpisz frazę (np. 'inflacja', 'CPK', 'aborcja')..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm text-slate-900 placeholder:text-slate-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Szukam...' : 'Szukaj'}
                    </button>
                </form>
            </div>

            {/* Results or Recent */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {hasSearched
                            ? (speeches.length > 0 ? `Wyniki wyszukiwania (${speeches.length})` : `Brak wyników dla "${query}"`)
                            : 'Ostatnie wypowiedzi'
                        }
                    </h2>
                    {!hasSearched && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar size={14} /> Ostatnie posiedzenia
                        </span>
                    )}
                </div>

                <div className="grid gap-4">
                    {/* Show No Results Message */}
                    {hasSearched && speeches.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xl font-bold text-slate-700 mb-2">Nie znaleziono wypowiedzi.</p>
                            <p className="text-slate-500">Spróbuj wpisać inne słowo kluczowe lub sprawdź pisownię.</p>
                            <button
                                onClick={() => {
                                    setHasSearched(false);
                                    setQuery('');
                                    setSpeeches([]);
                                }}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-bold hover:underline"
                            >
                                Wróć do ostatnich wypowiedzi
                            </button>
                        </div>
                    )}

                    {/* Show Results OR Recent (if not searched) */}
                    {(!hasSearched ? recentSpeeches : speeches).map((speech) => (
                        <div key={speech.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                    {speech.mp ? (
                                        <Link to={`/poslowie/${speech.mp.id}`} className="flex items-center gap-3 group">
                                            <img
                                                src={speech.mp.photo_url}
                                                alt={speech.mp.name}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-100 group-hover:border-blue-200 transition-colors"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                    {speech.mp.name}
                                                </p>
                                                <p className="text-xs font-bold text-slate-500 uppercase">
                                                    {speech.mp.party}
                                                </p>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                <User size={20} />
                                            </div>
                                            <p className="font-bold text-slate-900">{speech.speaker_name}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="text-right">
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {speech.date}
                                    </span>
                                    <p className="text-xs text-slate-400 mt-1">Posiedzenie {speech.sitting}</p>
                                </div>
                            </div>

                            <div className="prose prose-slate max-w-none mb-4">
                                <p
                                    className="text-slate-700 leading-relaxed line-clamp-4"
                                    dangerouslySetInnerHTML={{
                                        __html: query ? highlightText(speech.content, query) : (speech.content.slice(0, 300) + (speech.content.length > 300 ? '...' : ''))
                                    }}
                                />
                            </div>

                            <Link to={`/wypowiedzi/${speech.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                Czytaj całą wypowiedź &rarr;
                            </Link>
                        </div>
                    ))}

                    {speeches.length === 0 && recentSpeeches.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            Brak wypowiedzi w bazie. Uruchom skrypt importu.
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
