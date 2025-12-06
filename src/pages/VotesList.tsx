import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Search, SlidersHorizontal, X, Filter } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/TermSwitcher';
import SEO from '../components/SEO';

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
    category: string;
    verdict: string;
    print_number: string | null;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
    };
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
    const [categoryFilter, setCategoryFilter] = useState('WSZYSTKIE');
    const [verdictFilter, setVerdictFilter] = useState('WSZYSTKIE');
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
    const [sortMode, setSortMode] = useState<'LATEST' | 'IMPORTANT'>('LATEST'); // New State
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Debounced Search
    const debouncedSearch = useDebounce((query: string) => {
        setPage(0);
        setSliderPage(0);
        fetchVotes(query, categoryFilter, verdictFilter, dateRange, sortMode, 0, term);
    }, 500);

    useEffect(() => {
        // Initial fetch
        fetchVotes(searchQuery, categoryFilter, verdictFilter, dateRange, sortMode, page, term);
        setSliderPage(page); // Sync slider with page
    }, [page, categoryFilter, verdictFilter, dateRange, sortMode, term]);

    // Handle Search Input Change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const fetchVotes = async (
        search: string,
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
                .select('id, sitting, voting_number, date, title_clean, title_raw, category, verdict, print_number, details_json, importance_score', { count: 'estimated' })
                .eq('term', termParam); // Filter by term

            // Apply Filters
            if (search) {
                query = query.or(`title_clean.ilike.%${search}%,title_raw.ilike.%${search}%`);
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
        setCategoryFilter('WSZYSTKIE');
        setVerdictFilter('WSZYSTKIE');
        setDateRange({ start: '', end: '' });
        setSortMode('LATEST');
        setPage(0);
        setSliderPage(0);
        setSliderPage(0);
        fetchVotes('', 'WSZYSTKIE', 'WSZYSTKIE', { start: '', end: '' }, 'LATEST', 0, term);
    };

    const hasActiveFilters = searchQuery || categoryFilter !== 'WSZYSTKIE' || verdictFilter !== 'WSZYSTKIE' || dateRange.start || dateRange.end;

    // Handle Slider Change (Visual Only)
    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderPage(parseInt(e.target.value));
    };

    // Handle Slider Release (Commit Change)
    const handleSliderCommit = () => {
        setPage(sliderPage);
    };

    return (
        <div className="min-h-screen bg-paper text-neutral-900 pt-32 pb-12 px-6 md:px-12 font-serif">
            <SEO
                title="Głosowania Sejmowe"
                description="Pełne archiwum głosowań Sejmu RP. Przeszukuj wyniki, sprawdzaj, jak głosowali posłowie i analizuj kluczowe decyzje."
            />
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                {/* Header */}
                <div className="space-y-4 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-neutral-900">
                            Archiwum Głosowań
                        </h1>
                        <p className="text-lg text-neutral-600 max-w-2xl font-sans mt-2">
                            Przeszukuj bazę legislacyjną Sejmu {term === 9 ? 'IX' : 'X'} kadencji.
                        </p>
                    </div>
                    <TermSwitcher />
                </div>

                {/* SEARCH & FILTER ENGINE */}
                <div className="bg-white border border-neutral-200 shadow-sm rounded-lg overflow-hidden">

                    {/* A. Top Bar */}
                    <div className="flex flex-col md:flex-row items-center border-b border-neutral-200">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Szukaj po tytule (np. podatki, aborcja)..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-16 pr-6 py-6 text-lg bg-transparent border-none focus:ring-0 placeholder:text-neutral-400 font-sans text-neutral-900"
                            />
                        </div>
                        <button
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className={`flex items-center gap-2 px-8 py-6 border-t md:border-t-0 md:border-l border-neutral-200 hover:bg-neutral-50 transition-colors font-sans font-medium text-sm uppercase tracking-wide ${isFiltersOpen ? 'bg-neutral-50 text-blue-600' : 'text-neutral-600'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            Filtry
                        </button>
                    </div>

                    {/* B. Collapsible Filter Drawer */}
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-neutral-50 border-b border-neutral-200 transition-all duration-300 ease-in-out ${isFiltersOpen ? 'block' : 'hidden'}`}>

                        {/* Control 1: Category */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-sans">Kategoria</label>
                            <div className="relative">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); setSliderPage(0); }}
                                    className="w-full appearance-none bg-white border border-neutral-300 rounded-none px-4 py-3 pr-10 focus:border-neutral-900 focus:ring-0 font-sans text-sm"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat === 'WSZYSTKIE' ? 'Wszystkie kategorie' : cat}</option>
                                    ))}
                                </select>
                                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>

                        {/* Control 2: Verdict (Segmented Control) */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-sans">Wynik</label>
                            <div className="flex rounded-none border border-neutral-300 bg-white overflow-hidden">
                                {['WSZYSTKIE', 'PRZYJĘTO', 'ODRZUCONO'].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => { setVerdictFilter(v); setPage(0); setSliderPage(0); }}
                                        className={`flex-1 py-3 text-xs font-bold font-sans transition-colors ${verdictFilter === v
                                            ? v === 'PRZYJĘTO' ? 'bg-green-600 text-white'
                                                : v === 'ODRZUCONO' ? 'bg-red-600 text-white'
                                                    : 'bg-neutral-900 text-white'
                                            : 'hover:bg-neutral-50 text-neutral-600'
                                            }`}
                                    >
                                        {v === 'WSZYSTKIE' ? 'WSZYSTKIE' : v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Control 3: Date Range */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-sans">Data</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(0); setSliderPage(0); }}
                                    className="w-full bg-white border border-neutral-300 rounded-none px-3 py-3 focus:border-neutral-900 focus:ring-0 font-sans text-sm"
                                    placeholder="Od"
                                />
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(0); setSliderPage(0); }}
                                    className="w-full bg-white border border-neutral-300 rounded-none px-3 py-3 focus:border-neutral-900 focus:ring-0 font-sans text-sm"
                                    placeholder="Do"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sort Toggles */}
                    <div className="px-8 py-4 bg-white border-t border-neutral-100 flex items-center gap-4">
                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider font-sans">Sortuj:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSortMode('LATEST')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-full transition-colors font-sans ${sortMode === 'LATEST' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                            >
                                Najnowsze
                            </button>
                            <button
                                onClick={() => setSortMode('IMPORTANT')}
                                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-full transition-colors font-sans ${sortMode === 'IMPORTANT' ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                            >
                                Najważniejsze
                            </button>
                        </div>
                    </div>

                    {/* Results Counter & Active Filters */}
                    <div className="px-8 py-4 bg-white flex justify-between items-center">
                        <span className="text-sm font-sans text-neutral-500">
                            Znaleziono <strong className="text-neutral-900">{totalCount}</strong> wyników
                            {searchQuery && <span> dla frazy "<span className="text-neutral-900">{searchQuery}</span>"</span>}
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wide font-sans flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Wyczyść filtry
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {errorMsg ? (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-600 flex items-center gap-2 font-sans">
                            <AlertCircle className="w-5 h-5" />
                            <span>Błąd: {errorMsg}</span>
                        </div>
                    ) : loading && votes.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500 font-sans">Ładowanie archiwum...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-neutral-200 rounded-lg">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-neutral-100 rounded-full">
                                    <Search className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 font-sans">Brak wyników</h3>
                                <p className="text-neutral-500 font-sans max-w-md mx-auto">
                                    Nie znaleziono głosowań spełniających wybrane kryteria. Spróbuj zmienić filtry lub wpisać inną frazę.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-2 px-6 py-2 bg-neutral-900 text-white text-sm font-bold uppercase tracking-wide hover:bg-neutral-800 transition-colors"
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
                                className="group block bg-white border border-neutral-200 p-6 hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 font-sans">
                                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1">
                                                {vote.category || 'Głosowanie'}
                                            </span>
                                            <span className="text-xs text-neutral-400">
                                                {new Date(vote.date).toLocaleDateString('pl-PL')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-serif font-bold text-neutral-900 group-hover:text-blue-600 transition-colors leading-snug mb-2">
                                            {cleanSejmTitle(vote.title_clean || vote.title_raw || '')}
                                        </h3>
                                        <p className="text-sm text-neutral-500 font-sans">
                                            Posiedzenie {vote.sitting}, Głosowanie {vote.voting_number}
                                        </p>
                                    </div>

                                    {/* Verdict & Stats */}
                                    <div className="flex items-center gap-6 md:pl-8 md:border-l border-neutral-100 min-w-[220px]">
                                        <div className="flex flex-col items-end gap-1 w-full">
                                            <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide px-3 py-1 rounded-full ${vote.verdict === 'PRZYJĘTO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {vote.verdict === 'PRZYJĘTO' ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Przyjęto</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        <span>Odrzucono</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-xs text-neutral-400 font-sans mt-1 flex gap-3">
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {vote.details_json?.yes || 0}</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {vote.details_json?.no || 0}</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neutral-300"></span> {vote.details_json?.abstain || 0}</span>
                                            </div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-neutral-300 group-hover:text-blue-500 transition-colors" />
                                    </div>

                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {votes.length > 0 && (
                    <div className="flex flex-col items-center gap-6 pt-8 pb-12">

                        {/* Slider Control */}
                        <div className="w-full max-w-md flex items-center gap-4">
                            <span className="text-xs font-bold text-neutral-400 font-sans">1</span>
                            <input
                                type="range"
                                min={0}
                                max={Math.ceil(totalCount / PAGE_SIZE) - 1}
                                value={sliderPage}
                                onChange={handleSliderChange}
                                onMouseUp={handleSliderCommit}
                                onTouchEnd={handleSliderCommit}
                                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900 dark:accent-white"
                            />
                            <span className="text-xs font-bold text-neutral-400 font-sans">
                                {Math.ceil(totalCount / PAGE_SIZE)}
                            </span>
                        </div>

                        {/* Page Info & Buttons */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-6 py-2 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 text-xs font-bold uppercase tracking-wide disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors font-sans rounded-lg text-neutral-900 dark:text-white"
                            >
                                Poprzednia
                            </button>

                            <span className="text-sm font-bold font-sans text-neutral-900 dark:text-white">
                                Strona {sliderPage + 1} z {Math.ceil(totalCount / PAGE_SIZE)}
                            </span>

                            <button
                                onClick={() => setPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE) - 1, p + 1))}
                                disabled={page >= Math.ceil(totalCount / PAGE_SIZE) - 1}
                                className="px-6 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border border-neutral-900 dark:border-white text-xs font-bold uppercase tracking-wide hover:bg-neutral-800 dark:hover:bg-slate-200 transition-colors font-sans disabled:opacity-50 rounded-lg"
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
