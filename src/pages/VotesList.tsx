import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, CheckCircle2, XCircle, MinusCircle, HelpCircle } from 'lucide-react';
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
        page,
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

    return (
        <div className="min-h-screen bg-page pt-24 pb-12 px-4 md:px-8">
            <SEO
                title="Archiwum Głosowań"
                description="Pełna baza głosowań Sejmu X kadencji. Wyszukuj, filtruj i sprawdzaj jak głosowali posłowie."
                url="/glosowania"
            />
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        {mpId && (
                            <Link to="/glosowania" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-4 text-xs font-bold uppercase tracking-widest transition-colors mb-4 block">
                                <ArrowLeft size={14} />
                                Wróć do wszystkich głosowań
                            </Link>
                        )}
                        <h1 className="text-4xl md:text-5xl font-black text-primary mb-4 tracking-tighter">
                            {mpName ? `Głosowania: ${mpName}` : 'Archiwum Głosowań'}
                        </h1>
                        <p className="text-secondary font-medium max-w-xl">
                            {mpName
                                ? `Wszystkie głosowania, w których brał udział poseł ${mpName} w ${term}. kadencji.`
                                : `Pełna historia decyzji podjętych przez Sejm ${term}. kadencji. Przeglądaj, filtruj i analizuj wyniki.`
                            }
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-surface p-6 rounded-[2rem] border border-border-base mb-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 animate-fade-in">
                                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Context Search Active</span>
                            </div>
                        )}
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
                        {filteredVotes.length > 0 ? (
                            filteredVotes.map((vote) => (
                                <Link
                                    key={vote.id}
                                    to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
                                    className="group bg-surface hover:bg-slate-50 border border-border-base p-6 rounded-3xl transition-all"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white/5 rounded-2xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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
                                            <h3 className="text-lg md:text-xl font-bold text-primary group-hover:text-blue-400 transition-colors leading-tight mb-2">
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
