import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Search, SlidersHorizontal, X, Filter, Star } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/TermSwitcher';
import SEO from '../components/SEO';
import { expandSearchQuery } from '../utils/searchContext';

// Simple debounce hook
function useDebounce<T extends (...args: any[]) => any>(func: T, wait: number) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            func(...args);
        }, wait);
    }, [func, wait]);
}

interface Vote {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    title_raw?: string;
    title_short?: string;
    category: string;
    verdict: string;
    print_number: string | null;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
    };
    importance_score?: number;
    is_key_vote?: boolean;
    persona_tags?: string[];
}

const CATEGORIES = [
    'WSZYSTKIE',
    'EKONOMIA',
    'PRAWNE',
    'PERSONALNE/PROCEDURALNE',
    'ZDROWIE',
    'EDUKACJA',
    'ROLNICTWO',
    'INFRASTRUKTURA',
    'SPRAWY ZAGRANICZNE',
    'INNE'
];

const VotesList: React.FC = () => {
    const { term } = useTerm();
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [sliderPage, setSliderPage] = useState(0); // Visual state for slider
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 20;

    // Filters State
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [personaFilter, setPersonaFilter] = useState(searchParams.get('persona') || '');
    const [categoryFilter, setCategoryFilter] = useState('WSZYSTKIE');
    const [verdictFilter, setVerdictFilter] = useState('WSZYSTKIE');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [sortMode, setSortMode] = useState<'LATEST' | 'IMPORTANT'>(searchParams.get('persona') ? 'IMPORTANT' : 'LATEST');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Debounced Search
    const debouncedSearch = useDebounce((query: string) => {
        setPage(0);
        setSliderPage(0);
        fetchVotes(query, personaFilter, categoryFilter, verdictFilter, dateRange, sortMode, 0, term);
    }, 500);

    useEffect(() => {
        // Initial fetch
        fetchVotes(searchQuery, personaFilter, categoryFilter, verdictFilter, dateRange, sortMode, page, term);
        setSliderPage(page); // Sync slider with page
    }, [page, personaFilter, categoryFilter, verdictFilter, dateRange, sortMode, term]);

    // Handle Search Input Change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const fetchVotes = async (
        search: string,
        persona: string,
        category: string,
        verdict: string,
        dates: { start: string; end: string },
        sort: 'LATEST' | 'IMPORTANT',
        pageParam: number,
        termParam: number // Add term param
    ) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            let query = supabase
                .from('votes')
                .select('id, sitting, voting_number, date, title_clean, title_raw, title_short, category, verdict, print_number, details_json, importance_score, persona_tags', { count: 'estimated' })
                .eq('term', termParam); // Filter by term

            // Apply Persona Filter (uses array contains with cs operator)
            if (persona) {
                query = query.filter('persona_tags', 'cs', `{${persona}}`);
            }

            // Apply Filters
            if (search) {
                // Contextual Search Logic
                const expandedTerms = expandSearchQuery(search);
                // Create OR pattern for all expanded terms (checking both clean and raw titles)
                // Format: column.ilike.%term%,column.ilike.%term%
                const patterns = expandedTerms.map(term =>
                    `title_clean.ilike.%${term}%,title_raw.ilike.%${term}%`
                ).join(',');

                query = query.or(patterns);
            }

            if (category !== 'WSZYSTKIE') {
                query = query.eq('category', category);
            }

            if (verdict !== 'WSZYSTKIE') {
                query = query.eq('verdict', verdict);
            }

            if (dates.start) {
                query = query.gte('date', `${dates.start}T00:00:00`);
            }
            if (dates.end) {
                query = query.lte('date', `${dates.end}T23:59:59`);
            }

            // Sorting
            if (sort === 'IMPORTANT') {
                // Primary: Importance, Secondary: Date
                query = query.order('importance_score', { ascending: false }).order('date', { ascending: false });
            } else {
                // Primary: Date, Secondary: Importance
                query = query.order('date', { ascending: false }).order('importance_score', { ascending: false });
            }

            // Pagination
            const { data, error, count } = await query
                .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

            if (error) throw error;
            setVotes(data || []);
            if (count !== null) setTotalCount(count);
        } catch (error: any) {
            console.error('Error fetching votes:', error);
            setErrorMsg(error.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setPersonaFilter('');
        setCategoryFilter('WSZYSTKIE');
        setVerdictFilter('WSZYSTKIE');
        setDateRange({ start: '', end: '' });
        setSortMode('LATEST');
        setPage(0);
        setSliderPage(0);
        fetchVotes('', '', 'WSZYSTKIE', 'WSZYSTKIE', { start: '', end: '' }, 'LATEST', 0, term);
    };

    const hasActiveFilters = searchQuery || personaFilter || categoryFilter !== 'WSZYSTKIE' || verdictFilter !== 'WSZYSTKIE' || dateRange.start || dateRange.end;

    // Handle Slider Change (Visual Only)
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderPage(parseInt(e.target.value));
    };

    // Handle Slider Release (Commit Change)
    const handleSliderCommit = () => {
        setPage(sliderPage);
    };

    return (
        <div className="min-h-screen bg-[#06060c] text-white pt-24 pb-16 px-4 md:px-8">
            <SEO
                title="Głosowania Sejmowe"
                description="Pełne archiwum głosowań Sejmu RP. Przeszukuj wyniki, sprawdzaj, jak głosowali posłowie i analizuj kluczowe decyzje."
            />
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
                            Archiwum Głosowań
                        </h1>
                        <p className="text-lg text-white/50">
                            Przeszukuj bazę legislacyjną Sejmu {term === 9 ? 'IX' : 'X'} kadencji.
                        </p>
                    </div>
                    <TermSwitcher />
                </div>

                {/* SEARCH & FILTER ENGINE */}
                <div className="bg-[#111126] border border-white/5 rounded-2xl overflow-hidden">

                    {/* A. Top Bar */}
                    <div className="flex flex-col md:flex-row items-center border-b border-white/5">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Szukaj po tytule (np. podatki, aborcja)..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-14 pr-6 py-5 text-base bg-transparent border-none focus:ring-0 placeholder:text-white/30 text-white"
                            />
                            {/* Context Search Badge */}
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 hidden md:flex items-center gap-1.5 pointer-events-none opacity-50 group-focus-within:opacity-100 transition-opacity">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">AI Context Search</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className={`flex items-center gap-2 px-8 py-5 border-t md:border-t-0 md:border-l border-white/5 hover:bg-white/5 transition-colors text-xs font-bold uppercase tracking-widest ${isFiltersOpen ? 'bg-white/5 text-blue-400' : 'text-white/50'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtry
                        </button>
                    </div>

                    {/* B. Collapsible Filter Drawer */}
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#0c0c1a] border-b border-white/5 transition-all duration-300 ease-in-out ${isFiltersOpen ? 'block' : 'hidden'}`}>

                        {/* Control 1: Category */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Kategoria</label>
                            <div className="relative">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); setSliderPage(0); }}
                                    className="w-full appearance-none bg-[#111126] border border-white/10 rounded-xl px-4 py-3 pr-10 focus:border-blue-500/50 focus:ring-0 text-sm text-white"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat === 'WSZYSTKIE' ? 'Wszystkie kategorie' : cat}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/30 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>

                        {/* Control 2: Verdict (Segmented Control) */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Wynik</label>
                            <div className="flex rounded-xl border border-white/10 bg-[#111126] overflow-hidden">
                                {['WSZYSTKIE', 'PRZYJĘTO', 'ODRZUCONO'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => { setVerdictFilter(v); setPage(0); setSliderPage(0); }}
                                        className={`flex-1 py-3 text-xs font-bold transition-colors ${verdictFilter === v
                                            ? v === 'PRZYJĘTO' ? 'bg-emerald-500/20 text-emerald-400'
                                                : v === 'ODRZUCONO' ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-white/10 text-white'
                                            : 'hover:bg-white/5 text-white/40'
                                            }`}
                                    >
                                        {v === 'WSZYSTKIE' ? 'WSZYSTKIE' : v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Control 3: Date Range */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Data</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(0); setSliderPage(0); }}
                                    className="w-full bg-[#111126] border border-white/10 rounded-xl px-3 py-3 focus:border-blue-500/50 focus:ring-0 text-sm text-white [color-scheme:dark]"
                                    placeholder="Od"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(0); setSliderPage(0); }}
                                    className="w-full bg-[#111126] border border-white/10 rounded-xl px-3 py-3 focus:border-blue-500/50 focus:ring-0 text-sm text-white [color-scheme:dark]"
                                    placeholder="Do"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort Toggles */}
                    <div className="px-6 py-4 bg-[#0c0c18] border-t border-white/5 flex items-center gap-4">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Sortuj:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSortMode('LATEST')}
                                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${sortMode === 'LATEST'
                                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-blue-500'
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
                            >
                                Najnowsze
                            </button>
                            <button
                                onClick={() => setSortMode('IMPORTANT')}
                                className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${sortMode === 'IMPORTANT'
                                    ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border-blue-500'
                                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'}`}
                            >
                                Najważniejsze
                            </button>
                        </div>
                    </div>

                    {/* Results Counter & Active Filters */}
                    <div className="px-6 py-4 flex justify-between items-center">
                        <span className="text-sm text-white/50">
                            Znaleziono <strong className="text-white">{totalCount}</strong> wyników
                            {searchQuery && <span> dla frazy "<span className="text-white">{searchQuery}</span>"</span>}
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-wide flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Wyczyść filtry
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-3">
                    {errorMsg ? (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>Błąd: {errorMsg}</span>
                        </div>
                    ) : loading && votes.length === 0 ? (
                        <div className="text-center py-16 text-white/40">Ładowanie archiwum...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-center py-16 bg-[#111126] border border-white/5 rounded-2xl">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white/5 rounded-full">
                                    <Search className="w-8 h-8 text-white/30" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Brak wyników</h3>
                                <p className="text-white/40 max-w-md mx-auto">
                                    Nie znaleziono głosowań spełniających wybrane kryteria. Spróbuj zmienić filtry lub wpisać inną frazę.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-2 px-6 py-2 bg-white text-[#06060c] text-xs font-bold uppercase tracking-wide hover:bg-white/90 transition-colors rounded-full"
                                >
                                    Wyczyść filtry
                                </button>
                            </div>
                        </div>
                    ) : (
                        votes.map((vote) => (
                            <Link
                                key={vote.id}
                                to={`/glosowania/${term}/${vote.sitting}/${vote.voting_number}`}
                                className="group block bg-[#111126] border border-white/5 rounded-xl p-5 hover:border-white/20 hover:bg-[#16162d] transition-all"
                            >
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            {(vote.importance_score && vote.importance_score >= 7) && (
                                                <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                                                    <Star className="w-3 h-3 fill-amber-400" /> Kluczowe
                                                </span>
                                            )}
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded-full">
                                                {vote.category || 'Głosowanie'}
                                            </span>
                                            <span className="text-xs text-white/30">
                                                {new Date(vote.date).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        <h3
                                            className="text-base font-bold text-white group-hover:text-blue-400 transition-colors leading-snug mb-1"
                                            title={vote.title_clean || vote.title_raw || ''}
                                        >
                                            {vote.title_short || cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                                        </h3>
                                        <p className="text-xs text-white/30">
                                            Posiedzenie {vote.sitting}, Głosowanie {vote.voting_number}
                                        </p>
                                    </div>

                                    {/* Verdict & Stats */}
                                    <div className="flex items-center gap-4 md:pl-6 md:border-l border-white/5 min-w-[180px]">
                                        <div className="flex flex-col items-end gap-1 w-full">
                                            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full ${vote.verdict === 'PRZYJĘTO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}>
                                                {vote.verdict === 'PRZYJĘTO' ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>Przyjęto</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        <span>Odrzucono</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-xs text-white/30 mt-1 flex gap-3">
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> {vote.details_json?.yes || 0}</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {vote.details_json?.no || 0}</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/30"></span> {vote.details_json?.abstain || 0}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-blue-400 transition-colors" />
                                    </div>

                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {votes.length > 0 && (
                    <div className="flex flex-col items-center gap-6 pt-10">

                        {/* Slider Control */}
                        <div className="w-full max-w-md flex items-center gap-4">
                            <span className="text-xs font-bold text-white/30">1</span>
                            <input
                                type="range"
                                min={0}
                                max={Math.ceil(totalCount / PAGE_SIZE) - 1}
                                value={sliderPage}
                                onChange={handleSliderChange}
                                onMouseUp={handleSliderCommit}
                                onTouchEnd={handleSliderCommit}
                                className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                            <span className="text-xs font-bold text-white/30">
                                {Math.ceil(totalCount / PAGE_SIZE)}
                            </span>
                        </div>

                        {/* Page Info & Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-5 py-2.5 bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wide disabled:opacity-30 hover:bg-white/10 transition-colors rounded-full text-white"
                            >
                                Poprzednia
                            </button>

                            <span className="text-sm font-bold text-white">
                                Strona {sliderPage + 1} z {Math.ceil(totalCount / PAGE_SIZE)}
                            </span>

                            <button
                                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE) - 1, p + 1))}
                                disabled={page >= Math.ceil(totalCount / PAGE_SIZE) - 1}
                                className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wide hover:bg-blue-500 transition-colors disabled:opacity-30 rounded-full"
                            >
                                Następna
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default VotesList;
