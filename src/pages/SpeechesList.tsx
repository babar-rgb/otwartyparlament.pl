import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Filter, X, ArrowRight } from 'lucide-react';
import { useSpeeches } from '../hooks/useSpeeches';

export default function SpeechesList() {
    const {
        query, setQuery,
        speeches,
        loading,
        recentSpeeches,
        hasSearched,
        totalCount,
        currentPage, setCurrentPage,
        ITEMS_PER_PAGE,
        mps,
        selectedMp, setSelectedMp,
        selectedParty, setSelectedParty,
        dateFrom, setDateFrom,
        dateTo, setDateTo,
        handleSearch,
        clearFilters,
        fetchSpeeches,
        PARTIES
    } = useSpeeches();

    const [showFilters, setShowFilters] = useState(false);

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
        <div className="min-h-screen bg-page pt-24 pb-12 px-4">
            <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

                {/* Header & Search */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black text-primary">
                        Wyszukiwarka Wypowiedzi
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto italic">
                        Przeszukaj <strong className="text-primary">{totalCount.toLocaleString()}</strong> stenogramów z posiedzeń Sejmu.
                    </p>

                    {/* Search Card */}
                    <div className="max-w-3xl mx-auto bg-surface p-6 rounded-3xl border border-border-base shadow-xl">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Wpisz frazę (np. 'inflacja', 'CPK', 'aborcja')..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-12 pr-32 py-4 rounded-xl bg-black/5 dark:bg-white/5 border border-border-base focus:border-accent-blue/50 focus:ring-0 text-lg text-primary placeholder:text-secondary/30 transition-colors"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30" size={24} />

                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-2.5 rounded-xl transition-colors ${showFilters ? 'bg-accent-blue text-white' : 'bg-black/10 dark:bg-white/5 text-secondary hover:bg-black/20 dark:hover:bg-white/10'}`}
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
                                        className="w-full p-3 bg-black/5 dark:bg-white/5 border border-border-base rounded-xl text-sm text-primary focus:border-accent-blue/50 focus:ring-0 appearance-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
                                        className="w-full p-3 bg-black/5 dark:bg-white/5 border border-border-base rounded-xl text-sm text-primary focus:border-accent-blue/50 focus:ring-0 appearance-none cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                                    >
                                        <option value="">Wszystkie kluby</option>
                                        {PARTIES.map(party => (
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
                                            className="w-full p-3 bg-black/5 dark:bg-white/5 border border-border-base rounded-xl text-sm text-primary focus:border-accent-blue/50 focus:ring-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                        <input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            className="w-full p-3 bg-black/5 dark:bg-white/5 border border-border-base rounded-xl text-sm text-primary focus:border-accent-blue/50 focus:ring-0 hover:bg-black/10 dark:hover:bg-white/10 transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results or Recent */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border-base pb-4">
                        <h2 className="text-2xl font-black text-primary flex items-center gap-3">
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
                            <div key={speech.id} className="bg-surface p-8 rounded-[2rem] border border-border-base shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        {speech.mp ? (
                                            <Link to={`/poslowie/${speech.mp.id}`} className="flex items-center gap-4 group/author">
                                                <img
                                                    src={speech.mp.photo_url}
                                                    alt={speech.mp.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-100 group-hover:border-blue-200 transition-colors"
                                                />
                                                <div>
                                                    <p className="font-black text-primary group-hover/author:text-accent-blue transition-colors text-lg">
                                                        {speech.mp.name}
                                                    </p>
                                                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-60">
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
                                        <span className="text-[10px] font-black text-secondary bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-border-base">
                                            {speech.date}
                                        </span>
                                        <p className="text-[10px] font-black text-secondary opacity-40 mt-1 uppercase tracking-widest">Posiedzenie {speech.sitting}</p>
                                    </div>
                                </div>

                                <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                                    <p
                                        className="text-secondary leading-relaxed line-clamp-4 font-medium italic opacity-80"
                                        dangerouslySetInnerHTML={{
                                            __html: query ? highlightText(speech.content, query) : (speech.content.slice(0, 300) + (speech.content.length > 300 ? '...' : ''))
                                        }}
                                    />
                                </div>

                                <Link to={`/wypowiedzi/${speech.id}`} className="inline-flex items-center gap-2 text-xs font-black text-accent-blue uppercase tracking-widest hover:translate-x-1 transition-transform">
                                    Czytaj całą wypowiedź <ArrowRight size={14} />
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
                    <div className="mt-12 p-10 bg-surface rounded-[2.5rem] border border-border-base shadow-2xl animate-fade-in-up">
                        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between mb-6 px-2">
                                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-40">Najnowsze</span>
                                    <div className="text-[10px] font-black text-accent-blue bg-accent-blue/10 px-4 py-2 rounded-full border border-accent-blue/20 uppercase tracking-[0.2em]">
                                        Strona {currentPage + 1} z {Math.ceil(totalCount / ITEMS_PER_PAGE).toLocaleString()}
                                    </div>
                                    <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] opacity-40">Starsze</span>
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
                                        className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-blue hover:scale-y-125 transition-all"
                                    />
                                </div>
                                <div className="flex justify-between mt-4 text-[9px] font-black text-secondary uppercase tracking-[0.2em] px-2 opacity-50">
                                    <span>Początek {totalCount > 74000 ? 'X' : ''} kadencji</span>
                                    <span>Przesuń, aby cofnąć się w czasie</span>
                                </div>
                            </div>

                            <div className="bg-black/5 dark:bg-white/5 px-10 py-8 rounded-3xl border border-border-base text-center shrink-0 min-w-[220px]">
                                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 opacity-50">Wypowiedzi w bazie</div>
                                <div className="text-4xl font-black text-primary">
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
