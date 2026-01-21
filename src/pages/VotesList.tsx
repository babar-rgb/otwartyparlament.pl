import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle2, XCircle, MinusCircle, HelpCircle } from 'lucide-react';
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
        setVerdict
    } = useVotesList(mpId, rebellion);


    useEffect(() => {
        if (mpId) {
            fetchMP(mpId).then(mp => {
                if (mp) setMpName(`${mp.first_name} ${mp.last_name}`);
            }).catch(console.error);
        }
    }, [mpId]);

    const [filterSource, setFilterSource] = useState<'ALL' | 'LAST_SITTING'>('ALL');
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'LAWS' | 'RESOLUTIONS' | 'PERSONAL' | 'PROCEDURAL'>('ALL');

    const displayVotes = filteredVotes.filter(vote => {
        // 1. Filter by Source (Sitting)
        if (filterSource === 'LAST_SITTING' && filteredVotes.length > 0) {
            const lastSitting = filteredVotes[0].sitting;
            if (vote.sitting !== lastSitting) return false;
        }

        // 2. Filter by Category
        if (filterCategory === 'ALL') return true;

        const title = (vote.title || '').toLowerCase();
        const topic = (vote.topic || '').toLowerCase();
        const kind = (vote.kind || '').toLowerCase();

        if (filterCategory === 'LAWS') {
            return kind.includes('ustaw') || title.includes('o zmianie ustawy') || title.includes('projekt ustawy');
        }
        if (filterCategory === 'RESOLUTIONS') {
            return kind.includes('uchwał') || title.includes('projekt uchwały') || title.includes('w sprawie uchwały');
        }
        if (filterCategory === 'PERSONAL') {
            return topic.includes('wybór') || topic.includes('powołan') || topic.includes('odwołan') ||
                title.includes('powołan') || title.includes('odwołan') || title.includes('wybór');
        }
        if (filterCategory === 'PROCEDURAL') {
            return title.includes('porządek dzienny') || title.includes('przerw') || title.includes('odroczen');
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
                <UpcomingSittings />
                {/* Filter & Search Section */}
                <div className="bg-surface p-6 rounded-[var(--radius-card-xl)] border border-border-base mb-10 shadow-2xl backdrop-blur-md">
                    {/* ... (content stays same, just width wrapper changed) ... */}
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative flex-1">
                                <div className="relative flex items-center gap-4">
                                    <Search className={`text-secondary transition-colors ${isContextualSearch ? 'text-blue-400' : ''}`} size={24} />
                                    <input
                                        type="text"
                                        placeholder="Szukaj po tytule, temacie lub słowach kluczowych..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-slate-400 focus:outline-none"
                                    />
                                    {isContextualSearch && (
                                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 rounded-full border border-accent-blue/20 animate-fade-in">
                                            <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider">Wyszukiwanie kontekstowe aktywne</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
                                {[
                                    { label: 'WSZYSTKIE', value: 'ALL' },
                                    { label: 'OSTATNIE POSIEDZENIE', value: 'LAST_SITTING' }
                                ].map((f) => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFilterSource(f.value as any)}
                                        className={`px-6 py-4 rounded-[var(--radius-badge)] font-black text-xs uppercase tracking-wider whitespace-nowrap transition-all border ${filterSource === f.value
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                                            : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white hover:text-primary transition-colors'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 border-t border-border-base/50 pt-6 items-end">
                            {CATEGORY_FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilterCategory(f.value as any)}
                                    className={`px-4 py-2 rounded-[var(--radius-badge)] font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${filterCategory === f.value
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                                        : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white hover:text-primary transition-colors'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                            <div className="h-8 w-px bg-border-base mx-2" />
                            {/* Advanced Filters */}
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-accent-blue"
                                />
                                <span className="self-center text-secondary">-</span>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-accent-blue"
                                />
                                <select
                                    value={verdict}
                                    onChange={(e) => setVerdict(e.target.value)}
                                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-accent-blue uppercase tracking-wider"
                                >
                                    <option value="">Werdykt (Wszystkie)</option>
                                    <option value="PRZYJĘTO">Przyjęto</option>
                                    <option value="ODRZUCONO">Odrzucono</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4">
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
                    <div className="grid gap-4 3xl:grid-cols-2 3xl:gap-6">
                        {displayVotes.length > 0 ? (
                            displayVotes.map((vote) => (
                                <Link
                                    key={vote.id}
                                    to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
                                    className="group bg-surface hover:bg-hover border border-border-base p-6 rounded-[var(--radius-card-md)] transition-all shadow-sm hover:shadow-xl hover:shadow-accent-blue/5"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-page rounded-[var(--radius-badge)] shrink-0 group-hover:bg-accent-blue group-hover:text-white transition-colors border border-border-base/50">
                                            <span className="text-[10px] font-bold uppercase opacity-60">
                                                {new Date(vote.date).toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '')}
                                            </span>
                                            <span className="text-2xl font-black">{new Date(vote.date).getDate()}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
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

                                                <p className="text-sm text-secondary line-clamp-1 border-l border-border-base pl-3">{vote.topic}</p>
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
                            ))
                        ) : (
                            <div className="text-center py-20 grayscale opacity-50">
                                <p className="text-secondary text-lg">Nie znaleziono głosowań.</p>
                            </div>
                        )}
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
        </div>
    );
};

export default VotesList;
