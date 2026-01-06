import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle2, XCircle, MinusCircle, HelpCircle, Sparkles } from 'lucide-react';
import TermSwitcher from '../components/ui/TermSwitcher';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { useVotesList } from '../hooks/useVotesList';
import SEO from '../components/SEO';
import { fetchMP } from '../api';
import Skeleton from '../components/ui/Skeleton';

const VotesList = () => {
    const [searchParams] = useSearchParams();
    const mpId = searchParams.get('mp_id');
    const [mpName, setMpName] = useState<string | null>(null);

    const {
        filteredVotes,
        loading,
        searchQuery,
        setSearchQuery,
        isContextualSearch,
        term,
        setPage,
        hasMore
    } = useVotesList(mpId);

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
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest mb-4">
                                <Sparkles size={12} />
                                Legislative Database v1.0
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                                {mpName ? `Głosowania: ${mpName}` : (
                                    <>Archiwum <span className="italic font-serif text-accent-blue/80">Głosowań</span></>
                                )}
                            </h1>
                            <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                                {mpName
                                    ? `Wszystkie głosowania, w których brał udział poseł ${mpName} w ${term}. kadencji.`
                                    : `Pełna historia decyzji podjętych przez Sejm ${term}. kadencji. Przeglądaj, filtruj i analizuj wyniki.`
                                }
                            </p>
                        </div>
                        <TermSwitcher />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-8 pt-12">

                {/* Filter & Search Section */}
                <div className="bg-surface p-6 rounded-[2rem] border border-border-base mb-10 shadow-2xl backdrop-blur-md">
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
                                        className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-secondary/20 focus:outline-none"
                                    />
                                    {isContextualSearch && (
                                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 rounded-full border border-accent-blue/20 animate-fade-in">
                                            <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider">Context Search Active</span>
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
                                        className={`px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all border ${filterSource === f.value
                                            ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                                            : 'bg-page text-secondary border-border-base hover:bg-surface hover:text-primary'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 border-t border-border-base/50 pt-6">
                            {CATEGORY_FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilterCategory(f.value as any)}
                                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${filterCategory === f.value
                                        ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                                        : 'bg-surface text-secondary border-border-base hover:bg-page hover:text-primary'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-surface border border-border-base p-6 rounded-3xl flex flex-col md:flex-row gap-6 items-center shadow-sm">
                                <Skeleton className="w-16 h-16 rounded-2xl bg-white/5" />
                                <div className="flex-1 w-full space-y-3">
                                    <Skeleton className="h-8 w-3/4 bg-white/5 rounded-xl" />
                                    <Skeleton className="h-4 w-1/2 bg-white/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {displayVotes.length > 0 ? (
                            displayVotes.map((vote) => (
                                <Link
                                    key={vote.id}
                                    to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
                                    className="group bg-surface hover:bg-page border border-border-base p-6 rounded-3xl transition-all shadow-sm hover:shadow-xl hover:shadow-accent-blue/5"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-page rounded-2xl shrink-0 group-hover:bg-accent-blue group-hover:text-white transition-colors border border-border-base/50">
                                            <span className="text-xs font-bold uppercase opacity-60">{new Date(vote.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-2xl font-black">{new Date(vote.date).getDate()}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
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
                                            <p className="text-sm text-secondary line-clamp-1">{vote.topic}</p>
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
                            onClick={() => setPage(p => p + 1)}
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
