import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Calendar, FileText, User } from 'lucide-react';

interface Interpellation {
    id: number;
    term: number;
    num: number;
    title: string;
    date: string;
    receipt_date: string;
    last_modified: string;
    from_mp: string; // JSON string or array
    to_minister: string; // JSON string or array
    sent_date: string;
    replies: any;
    raw_data: {
        content?: string;
        [key: string]: any;
    };
}

export default function InterpellationsList() {
    const [query, setQuery] = useState('');
    const [interpellations, setInterpellations] = useState<Interpellation[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentInterpellations, setRecentInterpellations] = useState<Interpellation[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Load recent on mount
    useEffect(() => {
        fetchRecent();
        fetchTotalCount();
    }, []);

    const fetchTotalCount = async () => {
        const { count } = await supabase
            .from('interpellations')
            .select('*', { count: 'exact', head: true });
        if (count) setTotalCount(count);
    };

    const fetchRecent = async () => {
        try {
            const { data, error } = await supabase
                .from('interpellations')
                .select('*')
                .order('receipt_date', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRecentInterpellations(data || []);
        } catch (err) {
            console.error('Error fetching recent interpellations:', err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            // Search in title AND raw_data->content
            // Note: Supabase 'ilike' on JSONB text fields requires casting or specific syntax.
            // For simplicity in MVP, we might just search title or use a text search if we had a dedicated column.
            // Since we stored content in raw_data->content, we can try to filter.
            // However, querying JSONB content with ilike is tricky without a generated column.
            // Let's try to search title first, and if we can, content.

            // Actually, the user specifically asked for CONTENT search.
            // We can use the ->> operator to get text and then ilike.

            const { data, error } = await supabase
                .from('interpellations')
                .select('*')
                .or(`title.ilike.%${query}%,raw_data->>content.ilike.%${query}%`)
                .order('receipt_date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setInterpellations(data || []);
        } catch (err) {
            console.error('Error searching interpellations:', err);
        } finally {
            setLoading(false);
        }
    };

    const highlightText = (text: string, highlight: string) => {
        if (!text) return '';
        if (!highlight.trim()) return text.slice(0, 300) + '...';

        const safeHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeHighlight})`, 'gi');

        const match = regex.exec(text);

        if (!match) {
            return text.slice(0, 300) + '...';
        }

        const matchIndex = match.index;
        const matchLength = match[0].length;

        const contextBefore = 60;
        const contextAfter = 240;

        let start = Math.max(0, matchIndex - contextBefore);
        let end = Math.min(text.length, matchIndex + matchLength + contextAfter);

        if (start > 0) {
            const spaceIndex = text.lastIndexOf(' ', start + 10);
            if (spaceIndex !== -1 && spaceIndex < matchIndex) {
                start = spaceIndex + 1;
            }
        }

        let snippet = text.slice(start, end);
        snippet = snippet.replace(regex, (m) => `<mark class="bg-yellow-200 font-bold rounded px-1">${m}</mark>`);

        return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pt-24 pb-12 px-4 animate-fade-in">

            {/* Header & Search */}
            <div className="text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900">
                    Wyszukiwarka Interpelacji
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Przeszukaj <strong>{totalCount.toLocaleString()}</strong> interpelacji poselskich. Sprawdź, o co pytają ministrów.
                </p>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
                    <input
                        type="text"
                        placeholder="Wpisz frazę (np. 'szpital', 'droga S7', 'nauczyciele')..."
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

            {/* Results */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {hasSearched
                            ? (interpellations.length > 0 ? `Wyniki wyszukiwania (${interpellations.length})` : `Brak wyników dla "${query}"`)
                            : 'Ostatnie interpelacje'
                        }
                    </h2>
                </div>

                <div className="grid gap-4">
                    {hasSearched && interpellations.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-xl font-bold text-slate-700 mb-2">Nie znaleziono interpelacji.</p>
                            <button
                                onClick={() => {
                                    setHasSearched(false);
                                    setQuery('');
                                    setInterpellations([]);
                                }}
                                className="mt-4 text-blue-600 hover:text-blue-700 font-bold hover:underline"
                            >
                                Wróć do ostatnich
                            </button>
                        </div>
                    )}

                    {(!hasSearched ? recentInterpellations : interpellations).map((item) => {
                        // Parse authors if string
                        let authors = item.from_mp;
                        try {
                            if (typeof item.from_mp === 'string') authors = JSON.parse(item.from_mp);
                        } catch (e) { }

                        // Ensure authors is array
                        const authorList = Array.isArray(authors) ? authors : [authors];
                        const authorName = authorList[0] || 'Nieznany poseł';

                        const content = item.raw_data?.content || item.title;

                        return (
                            <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {authorName}
                                            </p>
                                            <p className="text-xs font-bold text-slate-500 uppercase">
                                                Interpelacja nr {item.num}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            {item.receipt_date}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800 mb-2">
                                    {item.title}
                                </h3>

                                <div className="prose prose-slate max-w-none mb-4">
                                    <p
                                        className="text-slate-700 leading-relaxed line-clamp-3 text-sm"
                                        dangerouslySetInnerHTML={{
                                            __html: query ? highlightText(content, query) : (content.slice(0, 300) + '...')
                                        }}
                                    />
                                </div>

                                <a
                                    href={`https://www.sejm.gov.pl/Sejm10.nsf/InterpelacjaTresc.xsp?key=${item.raw_data?.key || ''}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Zobacz źródło na sejm.gov.pl &rarr;
                                </a>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
