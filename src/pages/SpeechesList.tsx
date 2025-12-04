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

    // Load recent speeches on mount
    useEffect(() => {
        fetchRecentSpeeches();
    }, []);

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

        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

        // Find the part with the match and show context around it
        const matchIndex = parts.findIndex(part => part.toLowerCase() === highlight.toLowerCase());
        if (matchIndex === -1) return text.slice(0, 300) + '...';

        // Construct snippet
        let snippet = '';
        const start = Math.max(0, matchIndex - 1);
        const end = Math.min(parts.length, matchIndex + 2);

        for (let i = start; i < end; i++) {
            if (parts[i].toLowerCase() === highlight.toLowerCase()) {
                snippet += `<mark class="bg-yellow-200 font-bold rounded px-1">${parts[i]}</mark>`;
            } else {
                snippet += parts[i];
            }
        }

        return '...' + snippet + '...';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-24 pb-12 px-4 animate-fade-in">

            {/* Header & Search */}
            <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900">
                    Wyszukiwarka Wypowiedzi
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Przeszukaj stenogramy z posiedzeń Sejmu. Sprawdź, co dokładnie mówili posłowie.
                </p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
                    <input
                        type="text"
                        placeholder="Wpisz frazę (np. 'inflacja', 'CPK', 'aborcja')..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg shadow-sm"
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
                        {speeches.length > 0 ? `Wyniki wyszukiwania (${speeches.length})` : 'Ostatnie wypowiedzi'}
                    </h2>
                    {speeches.length === 0 && (
                        <span className="text-sm text-slate-500 flex items-center gap-1">
                            <Calendar size={14} /> Ostatnie posiedzenia
                        </span>
                    )}
                </div>

                <div className="grid gap-4">
                    {(speeches.length > 0 ? speeches : recentSpeeches).map((speech) => (
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
