import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle2, XCircle, MinusCircle, HelpCircle, Layers } from 'lucide-react';
import TermSwitcher from '../components/ui/TermSwitcher';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { useVotesList } from '../hooks/useVotesList';
import SEO from '../components/SEO';
import { fetchMP } from '../api';
import Skeleton from '../components/ui/Skeleton';
import { formatPolishDate } from '../utils/dateUtils';
import VoteConnections from '../components/VoteConnections';
import { UpcomingSittings } from '../components/features/UpcomingSittings';

const VotesList = () => {

    const getCategoryStyles = (topic: string = '') => {
        const t = (topic || '').toLowerCase();

        // MAPPING TO 'FOR YOU' PALETTE
        // P: Blue/Cyan
        if (t.includes('gospodarka') || t.includes('finans') || t.includes('podat') || t.includes('budżet') || t.includes('infrastruktura'))
            return {
                bg: 'bg-blue-50/50 dark:bg-blue-900/10',
                border: 'border-blue-200 dark:border-blue-500/20',
                text: 'text-blue-600 dark:text-blue-400',
                gradient: 'from-blue-500 to-cyan-500',
                badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
            };
        // R: Rose/Red
        if (t.includes('rodzin') || t.includes('społecz') || t.includes('pomoc') || t.includes('ukraiń'))
            return {
                bg: 'bg-rose-50/50 dark:bg-rose-900/10',
                border: 'border-rose-200 dark:border-rose-500/20',
                text: 'text-rose-600 dark:text-rose-400',
                gradient: 'from-rose-500 to-red-500',
                badge: 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            };
        // P: Emerald/Teal
        if (t.includes('praca') || t.includes('zdrow'))
            return {
                bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
                border: 'border-emerald-200 dark:border-emerald-500/20',
                text: 'text-emerald-600 dark:text-emerald-400',
                gradient: 'from-emerald-500 to-teal-500',
                badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            };
        // R: Yellow/Orange
        if (t.includes('rolnic') || t.includes('środow') || t.includes('klimat') || t.includes('energet'))
            return {
                bg: 'bg-orange-50/50 dark:bg-orange-900/10',
                border: 'border-orange-200 dark:border-orange-500/20',
                text: 'text-orange-600 dark:text-orange-400',
                gradient: 'from-yellow-500 to-orange-500',
                badge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
            };
        // S: Indigo/Violet
        if (t.includes('edukac') || t.includes('nauk') || t.includes('cyfryz'))
            return {
                bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
                border: 'border-indigo-200 dark:border-indigo-500/20',
                text: 'text-indigo-600 dark:text-indigo-400',
                gradient: 'from-indigo-500 to-violet-500',
                badge: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
            };
        // E: Purple/Pink
        if (t.includes('państw') || t.includes('praw') || t.includes('obronn') || t.includes('ustrój'))
            return {
                bg: 'bg-purple-50/50 dark:bg-purple-900/10',
                border: 'border-purple-200 dark:border-purple-500/20',
                text: 'text-purple-600 dark:text-purple-400',
                gradient: 'from-purple-500 to-pink-500',
                badge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
            };

        // General
        // General (Inne / Ogólne)
        return {
            bg: 'bg-surface hover:bg-black/5 dark:hover:bg-white/5',
            border: 'border-transparent',
            text: 'text-secondary/60',
            gradient: 'from-slate-500/20 to-slate-400/20',
            badge: 'bg-transparent text-secondary/40 border border-transparent'
        };
    };

    const [searchParams] = useSearchParams();
    const mpId = searchParams.get('mp_id');
    const rebellion = searchParams.get('rebellion') === 'true';
    const [mpName, setMpName] = useState<string | null>(null);

    const {
        filteredVotes,
        loading,
        searchQuery,
        setSearchQuery,
        isContextualSearch,
        term,
        setPage,
        hasMore,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        verdict,
        setVerdict,
        showProcedural,
        setShowProcedural,
        groupVotes,
        setGroupVotes,
        filterCategory,
        setFilterCategory
    } = useVotesList(mpId, rebellion);


    useEffect(() => {
        if (mpId) {
            fetchMP(mpId).then(mp => {
                if (mp) setMpName(`${mp.first_name} ${mp.last_name}`);
            }).catch(console.error);
        }
    }, [mpId]);

    const [filterSource, setFilterSource] = useState<'ALL' | 'LAST_SITTING'>('ALL');

    const displayVotes = filteredVotes.filter(vote => {
        // 1. Filter by Source (Sitting) - this is still client-side usually for "Last Sitting" tab
        if (filterSource === 'LAST_SITTING' && filteredVotes.length > 0) {
            const lastSitting = filteredVotes[0].sitting;
            if (vote.sitting !== lastSitting) return false;
        }

        return true;
    });

    const CATEGORY_FILTERS = [
        { label: 'WSZYSTKIE', value: 'ALL' },
        { label: 'PROJEKTY USTAW', value: 'LAWS' },
        { label: 'UCHWAŁY', value: 'RESOLUTIONS' },
        { label: 'PERSONALNE', value: 'PERSONAL' },
        { label: 'PROCEDURALNE', value: 'PROCEDURAL' },
    ];

    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const activeFiltersCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (verdict ? 1 : 0);

    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-page pb-12">
            <SEO
                title="Archiwum Głosowań"
                description="Pełna baza głosowań Sejmu X kadencji. Wyszukuj, filtruj i sprawdzaj jak głosowali posłowie."
                url="/glosowania"
            />
            {/* Hero Section */}
            <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base bg-page">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            {mpId && (
                                <Link to="/glosowania" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-4 text-xs font-bold uppercase tracking-widest transition-colors block">
                                    <ArrowLeft size={14} />
                                    Wróć do wszystkich głosowań
                                </Link>
                            )}

                            <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                                {mpName ? (
                                    rebellion ? `Głosy Odrębne: ${mpName}` : `Głosowania: ${mpName}`
                                ) : (
                                    <>Archiwum <span className="italic font-serif text-accent-blue/80">Głosowań</span></>
                                )}
                            </h1>
                            <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                                {mpName
                                    ? (rebellion
                                        ? `Lista głosowań, w których poseł ${mpName} zagłosował inaczej niż większość jego klubu.`
                                        : `Wszystkie głosowania, w których brał udział poseł ${mpName} w ${term}. kadencji.`)
                                    : `Pełna historia decyzji podjętych przez Sejm ${term}. kadencji. Przeglądaj, filtruj i analizuj wyniki.`
                                }
                            </p>
                        </div>
                        <TermSwitcher />
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-screen-2xl px-4 md:px-8 pt-12">
                {/* LAYOUT GRID: Search/List (Dynamic) & Calendar (Dynamic) */}
                <div className="flex flex-col xl:flex-row gap-6 mb-10 items-start transition-all duration-300 ease-in-out">

                    {/* SEARCH & VOTES LIST */}
                    <div className={`flex flex-col transition-all duration-500 ease-spring ${isCalendarOpen ? 'w-full xl:w-2/3' : 'w-full xl:w-[calc(100%-100px)]'}`}>
                        <div className="bg-surface rounded-[var(--radius-card-xl)] border border-border-base shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">

                            {/* Top Row: Search + Main Toggles */}
                            <div className="flex flex-col md:flex-row items-center gap-4 p-4 border-b border-border-base/50 flex-1">
                                <div className="relative flex-1 w-full">
                                    <div className="relative flex items-center gap-3">
                                        <Search className={`text-secondary transition-colors ${isContextualSearch ? 'text-blue-400' : ''}`} size={20} />
                                        <input
                                            type="text"
                                            placeholder="Szukaj..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-transparent text-base font-bold text-primary placeholder:text-slate-400 focus:outline-none py-2"
                                        />
                                        {isContextualSearch && (
                                            <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-accent-blue/10 rounded-full border border-accent-blue/20 animate-fade-in">
                                                <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider">AI</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                    <div className="h-6 w-px bg-border-base mx-2 hidden md:block" />

                                    {/* Source Filter (Tabs) */}
                                    <div className="flex bg-page/50 p-1 rounded-xl border border-border-base/50">
                                        {[
                                            { label: 'Wszystkie', value: 'ALL' },
                                            { label: 'Ostatnie', value: 'LAST_SITTING' }
                                        ].map((f) => (
                                            <button
                                                key={f.value}
                                                onClick={() => setFilterSource(f.value as any)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${filterSource === f.value
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-secondary hover:text-primary hover:bg-white/10'
                                                    }`}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isFiltersOpen || activeFiltersCount > 0
                                            ? 'bg-blue-600/10 text-blue-500 border-blue-600/30'
                                            : 'bg-page/50 text-secondary border-border-base hover:bg-white/5'
                                            }`}
                                    >
                                        <span>Filtry</span>
                                        {activeFiltersCount > 0 && (
                                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px]">
                                                {activeFiltersCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Middle Row: Categories (Horizontal Scroll) */}
                            <div className="px-4 py-3 bg-page/30 flex gap-2 overflow-x-auto no-scrollbar border-b border-border-base/50">
                                {CATEGORY_FILTERS.map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFilterCategory(f.value as any)}
                                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${filterCategory === f.value
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-transparent text-secondary border-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            {/* Collapsible Advanced Filters */}
                            {isFiltersOpen && (
                                <div className="p-4 bg-page/50 border-t border-border-base animate-slide-down">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-secondary tracking-widest pl-1">Data od</label>
                                            <input
                                                type="date"
                                                value={dateFrom}
                                                onChange={(e) => setDateFrom(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-surface border border-border-base focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-secondary tracking-widest pl-1">Data do</label>
                                            <input
                                                type="date"
                                                value={dateTo}
                                                onChange={(e) => setDateTo(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-surface border border-border-base focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-secondary tracking-widest pl-1">Werdykt</label>
                                            <select
                                                value={verdict}
                                                onChange={(e) => setVerdict(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-surface border border-border-base focus:outline-none focus:border-blue-500 uppercase tracking-wider"
                                            >
                                                <option value="">Wszystkie</option>
                                                <option value="PRZYJĘTO">Przyjęto</option>
                                                <option value="ODRZUCONO">Odrzucono</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            <label className="flex items-center gap-3 cursor-pointer group select-none" onClick={(e) => e.stopPropagation()}>
                                                <div className={`w-9 h-5 rounded-full transition-colors duration-200 ease-in-out relative ${showProcedural ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!showProcedural}
                                                        onChange={(e) => setShowProcedural(e.target.checked)}
                                                        className="absolute opacity-0 w-full h-full cursor-pointer inset-0 z-10"
                                                    />
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${showProcedural ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                                </div>
                                                <span className="text-[10px] font-black text-secondary tracking-widest uppercase group-hover:text-primary transition-colors whitespace-nowrap">Proceduralne</span>
                                            </label>

                                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                <div className={`w-9 h-5 rounded-full transition-colors duration-200 ease-in-out relative ${groupVotes ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!groupVotes}
                                                        onChange={(e) => setGroupVotes(e.target.checked)}
                                                        className="absolute opacity-0 w-full h-full cursor-pointer inset-0 z-10"
                                                    />
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${groupVotes ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                                                </div>
                                                <span className="text-[10px] font-black text-secondary tracking-widest uppercase group-hover:text-primary transition-colors whitespace-nowrap">Grupuj ustawy</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* VOTES LIST (Moved inside main column) */}
                        {loading ? (
                            <div className="grid gap-4 mt-6">
                                <div className="text-center py-8 animate-pulse text-secondary font-medium">
                                    {rebellion
                                        ? "Analiza archiwum głosowań..."
                                        : "Pobieranie archiwum głosowań..."}
                                </div>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="bg-surface border border-border-base p-6 rounded-[var(--radius-card-md)] flex flex-col md:flex-row gap-6 items-center shadow-sm">
                                        <Skeleton className="w-16 h-16 rounded-[var(--radius-badge)]" />
                                        <div className="flex-1 w-full space-y-3">
                                            <Skeleton className="h-8 w-3/4 rounded-[var(--radius-badge)]" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid gap-4 mt-6">
                                {displayVotes.length > 0 ? (
                                    displayVotes.map((vote) => {
                                        const styles = getCategoryStyles(vote.topic);
                                        return (
                                            <Link
                                                key={vote.id}
                                                to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
                                                className={`group bg-surface hover:bg-hover border transition-all shadow-sm hover:shadow-xl hover:shadow-accent-blue/5 p-6 rounded-[var(--radius-card-md)] ${styles.border} ${styles.bg}`}
                                            >
                                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                                    {/* Light Circle Date Badge */}
                                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full shrink-0 transition-all border relative overflow-hidden group-hover:scale-105 ${styles.border} ${styles.badge}`}>
                                                        {/* Gradient subtle overlay */}
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-5 group-hover:opacity-10`} />

                                                        <span className="text-[10px] font-bold uppercase opacity-60 relative z-10">
                                                            {new Date(vote.date).toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '')}
                                                        </span>
                                                        <span className="text-2xl font-black relative z-10">{new Date(vote.date).getDate()}</span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${styles.gradient}`} />
                                                            <span className="px-3 py-1 bg-white/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                                {formatPolishDate(vote.date)}
                                                            </span>
                                                            <span className="px-3 py-1 bg-white/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                                Posiedzenie {vote.sitting}
                                                            </span>
                                                            <span className="px-3 py-1 bg-white/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                                Głosowanie {vote.voting_number}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg md:text-xl font-bold text-primary group-hover:text-accent-blue transition-colors leading-tight mb-2">
                                                            {vote.title_clean || cleanSejmTitle(vote.title)}
                                                        </h3>

                                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                                            {/* Verdict Badge */}
                                                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${vote.verdict === 'PRZYJĘTO'
                                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                                }`}>
                                                                {vote.verdict}
                                                            </div>

                                                            <VoteConnections voteId={vote.id} />

                                                            {/* Mini Results Bar (if available) */}
                                                            {(vote.for !== undefined && (vote.for > 0 || (vote.against || 0) > 0)) && (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-1.5 w-24 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden flex">
                                                                        <div
                                                                            className="h-full bg-emerald-500"
                                                                            style={{ width: `${(vote.for! / (vote.for! + (vote.against || 0) + (vote.abstained || 0))) * 100}%` }}
                                                                        />
                                                                        <div
                                                                            className="h-full bg-rose-500"
                                                                            style={{ width: `${((vote.against || 0) / (vote.for! + (vote.against || 0) + (vote.abstained || 0))) * 100}%` }}
                                                                        />
                                                                        <div
                                                                            className="h-full bg-amber-500"
                                                                            style={{ width: `${((vote.abstained || 0) / (vote.for! + (vote.against || 0) + (vote.abstained || 0))) * 100}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-secondary tabular-nums">
                                                                        {vote.for}-{vote.against || 0}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2">
                                                                {/* Group BADGE */}
                                                                {vote.child_count && vote.child_count > 0 && (
                                                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase tracking-wider">
                                                                        <Layers size={10} className="stroke-[3]" />
                                                                        + {vote.child_count} gł.
                                                                    </div>
                                                                )}

                                                                <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md ${vote.topic ? styles?.badge : 'opacity-40 grayscale text-secondary'
                                                                    }`}>
                                                                    {vote.topic || 'Inne'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {vote.mpVote && (
                                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-border-base shrink-0">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${vote.mpVote === 'YES' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                vote.mpVote === 'NO' ? 'bg-rose-500/10 text-rose-400' :
                                                                    vote.mpVote === 'ABSTAIN' ? 'bg-amber-500/10 text-amber-400' :
                                                                        'bg-white/5 text-secondary'
                                                                }`}>
                                                                {vote.mpVote === 'YES' && <CheckCircle2 size={16} />}
                                                                {vote.mpVote === 'NO' && <XCircle size={16} />}
                                                                {vote.mpVote === 'ABSTAIN' && <MinusCircle size={16} />}
                                                                {vote.mpVote === 'ABSENT' && <HelpCircle size={16} />}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (<div className="text-center py-20 grayscale opacity-50">
                                    <p className="text-secondary text-lg">Nie znaleziono głosowań.</p>
                                </div>
                                )
                                }
                            </div>
                        )}

                        {hasMore && !loading && filteredVotes.length > 0 && (
                            <div className="mt-12 text-center">
                                <button
                                    onClick={() => setPage()}
                                    className="bg-surface hover:bg-black/5 dark:hover:bg-white/5 border border-border-base px-8 py-4 rounded-2xl font-bold text-primary transition-all hover:scale-105 active:scale-95 shadow-sm"
                                >
                                    Wczytaj więcej głosowań
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CALENDAR (Dynamic) */}
                    <div className={`shrink-0 transition-all duration-500 ease-spring ${isCalendarOpen ? 'w-full xl:w-1/3' : 'w-auto'}`}>
                        <UpcomingSittings isOpen={isCalendarOpen} onToggle={() => setIsCalendarOpen(!isCalendarOpen)} />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default VotesList;
