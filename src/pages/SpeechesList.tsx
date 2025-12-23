import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Filter, X } from 'lucide-react';

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

interface MP {
    id: number;
    name: string;
    party: string;
}

export default function SpeechesList() {
    const [query, setQuery] = useState('');
    const [speeches, setSpeeches] = useState<Speech[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentSpeeches, setRecentSpeeches] = useState<Speech[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState(0);
    const ITEMS_PER_PAGE = 10;

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [mps, setMps] = useState<MP[]>([]);
    const [selectedMp, setSelectedMp] = useState<string>('');
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const parties = ['KO', 'PiS', 'Polska2050', 'PSL-TD', 'Lewica', 'Konfederacja', 'Razem', 'Kukiz15'];

    // Load initial data
    useEffect(() => {
        fetchSpeeches(0);
        fetchTotalCount();
        fetchMps();
    }, []);

    const fetchMps = async () => {
        const { data } = await supabase.from('mps').select('id, name, party').order('name');
        if (data) setMps(data);
    };

    const fetchTotalCount = async () => {
        const { count } = await supabase
            .from('speeches')
            .select('*', { count: 'exact', head: true });
        if (count) setTotalCount(count);
    };

    const fetchSpeeches = async (page: number = 0) => {
        setLoading(true);
        try {
            const rangeStart = page * ITEMS_PER_PAGE;
            const rangeEnd = rangeStart + ITEMS_PER_PAGE - 1;

            const { data, error } = await supabase
                .from('speeches')
                .select(`
          *,
          mp:mps(id, name, party, photo_url)
        `)
                .order('date', { ascending: false })
                .order('id', { ascending: false })
                .range(rangeStart, rangeEnd);

            if (error) throw error;
            setRecentSpeeches(data || []);
        } catch (err) {
            console.error('Error fetching speeches:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        setHasSearched(true);
        try {
            let queryBuilder = supabase
                .from('speeches')
                .select(`
          *,
          mp:mps(id, name, party, photo_url)
        `);

            // Text Search
            if (query.trim()) {
                queryBuilder = queryBuilder.ilike('content', `%${query}%`);
            }

            // Filters
            if (selectedMp) {
                queryBuilder = queryBuilder.eq('mp_id', selectedMp);
            }
            if (selectedParty) {
                // We need to filter by joined table, but Supabase JS client doesn't support filtering on joined tables easily in one go for 1:N without !inner
                // Workaround: Filter by speaker_party if it exists on speeches, or use !inner on join
                // Assuming we don't have party on speeches, we use the !inner join trick
                queryBuilder = supabase
                    .from('speeches')
                    .select(`
                        *,
                        mp:mps!inner(id, name, party, photo_url)
                    `)
                    .eq('mp.party', selectedParty);

                if (query.trim()) queryBuilder = queryBuilder.ilike('content', `%${query}%`);
                if (selectedMp) queryBuilder = queryBuilder.eq('mp_id', selectedMp);
            }

            if (dateFrom) {
                queryBuilder = queryBuilder.gte('date', dateFrom);
            }
            if (dateTo) {
                queryBuilder = queryBuilder.lte('date', dateTo);
            }

            const { data, error } = await queryBuilder
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

    const clearFilters = () => {
        setQuery('');
        setSelectedMp('');
        setSelectedParty('');
        setDateFrom('');
        setDateTo('');
        setHasSearched(false);
        setSpeeches([]);
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
        <div className="min-h-screen bg-[#060613] pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

                {/* Header & Search */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black text-white">
                        Wyszukiwarka Wypowiedzi
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Przeszukaj <strong className="text-white">{totalCount.toLocaleString()}</strong> stenogramów z posiedzeń Sejmu.
                    </p>

                    {/* Search Card */}
                    <div className="max-w-3xl mx-auto bg-[#111126] p-4 rounded-2xl border border-white/10">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Wpisz frazę (np. 'inflacja', 'CPK', 'aborcja')..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-12 pr-32 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500/50 focus:ring-0 text-lg text-white placeholder:text-white/30 transition-colors"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={24} />

                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2.5 rounded-xl transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                                    title="Filtry"
                                >
                                    <Filter size={18} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? '...' : 'Szukaj'}
                                </button>
                            </div>
                        </form>

                        {/* Filters Panel */}
                        {showFilters && (
                            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                                {/* MP Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Poseł</label>
                                    <select
                                        value={selectedMp}
                                        onChange={(e) => setSelectedMp(e.target.value)}
                                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-0 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                                    >
                                        <option value="">Wszyscy posłowie</option>
                                        {mps.map(mp => (
                                            <option key={mp.id} value={mp.id}>{mp.name} ({mp.party})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Party Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Klub / Koło</label>
                                    <select
                                        value={selectedParty}
                                        onChange={(e) => setSelectedParty(e.target.value)}
                                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-0 appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                                    >
                                        <option value="">Wszystkie kluby</option>
                                        {parties.map(party => (
                                            <option key={party} value={party}>{party}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Zakres dat</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-0 hover:bg-white/10 transition-colors [color-scheme:dark]"
                                        />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-500/50 focus:ring-0 hover:bg-white/10 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results or Recent */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            {hasSearched
                                ? (speeches.length > 0 ? `Wyniki wyszukiwania (${speeches.length})` : `Brak wyników`)
                                : 'Ostatnie wypowiedzi'
                            }
                        </h2>
                        {hasSearched && (
                            <button onClick={clearFilters} className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1">
                                <X size={14} /> Wyczyść filtry
                            </button>
                        )}
                        {!hasSearched && (
                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar size={14} /> Ostatnie posiedzenia
                            </span>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {/* Show No Results Message */}
                        {hasSearched && speeches.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-xl font-bold text-slate-700 mb-2">Nie znaleziono wypowiedzi.</p>
                                <p className="text-slate-500">Spróbuj zmienić kryteria wyszukiwania.</p>
                            </div>
                        )}

                        {/* Show Results OR Recent (if not searched) */}
                        {(!hasSearched ? recentSpeeches : speeches).map((speech) => (
                            <div key={speech.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
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
                                                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {speech.mp.name}
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                                        {speech.mp.party}
                                                    </p>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={20} />
                                                </div>
                                                <p className="font-bold text-slate-900 dark:text-white">{speech.speaker_name}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                            {speech.date}
                                        </span>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Posiedzenie {speech.sitting}</p>
                                    </div>
                                </div>

                                <div className="prose prose-slate max-w-none mb-4">
                                    <p
                                        className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4"
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

                {/* Modern Pagination Slider */}
                {!hasSearched && recentSpeeches.length > 0 && totalCount > ITEMS_PER_PAGE && (
                    <div className="mt-12 p-8 bg-slate-800 dark:bg-[#111126] rounded-3xl border border-slate-700 dark:border-white/5 animate-fade-in-up">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between mb-4 px-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Najnowsze</span>
                                    <div className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 uppercase tracking-wider">
                                        Strona {currentPage + 1} z {Math.ceil(totalCount / ITEMS_PER_PAGE).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starsze</span>
                                </div>
                                <div className="relative h-10 flex items-center">
                                    <input
                                        type="range"
                                        min="0"
                                        max={Math.max(0, Math.ceil(totalCount / ITEMS_PER_PAGE) - 1)}
                                        step="1"
                                        value={currentPage}
                                        onChange={(e) => {
                                            const newPage = parseInt(e.target.value);
                                            setCurrentPage(newPage);
                                            fetchSpeeches(newPage);
                                            window.scrollTo({ top: 400, behavior: 'smooth' });
                                        }}
                                        className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                                    />
                                </div>
                                <div className="flex justify-between mt-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2">
                                    <span>Początek {totalCount > 74000 ? 'X' : ''} kadencji</span>
                                    <span>Przesuń, aby cofnąć się w czasie</span>
                                </div>
                            </div>

                            <div className="bg-black/20 px-8 py-6 rounded-2xl border border-white/5 text-center shrink-0 min-w-[200px]">
                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Wypowiedzi w bazie</div>
                                <div className="text-3xl font-black text-white">
                                    {totalCount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
