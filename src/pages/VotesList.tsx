import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Sparkles, CheckCircle2, XCircle, MinusCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { useVotesList } from '../hooks/useVotesList';
import { db } from '../lib/db';

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
        term
    } = useVotesList(mpId);

    useEffect(() => {
        if (mpId) {
            db.from('mps').select('name').eq('id', mpId).single().then(({ data }) => {
                if (data) setMpName(data.name);
            });
        }
    }, [mpId]);

    return (
        <div className="min-h-screen bg-[#06060c] pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        {mpId && (
                            <Link to="/glosowania" className="inline-flex items-center gap-2 text-white/40 hover:text-white mb-4 text-xs font-bold uppercase tracking-widest transition-colors mb-4 block">
                                <ArrowLeft size={14} />
                                Wróć do wszystkich głosowań
                            </Link>
                        )}
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter">
                            {mpName ? `Głosowania: ${mpName}` : 'Archiwum Głosowań'}
                        </h1>
                        <p className="text-white/40 font-medium max-w-xl">
                            {mpName
                                ? `Wszystkie głosowania, w których brał udział poseł ${mpName} w ${term}. kadencji.`
                                : `Pełna historia decyzji podjętych przez Sejm ${term}. kadencji. Przeglądaj, filtruj i analizuj wyniki.`
                            }
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-[#111126] p-6 rounded-[2rem] border border-white/5 mb-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-4">
                        <Search className={`text-white/30 transition-colors ${isContextualSearch ? 'text-blue-400' : ''}`} size={24} />
                        <input
                            type="text"
                            placeholder="Szukaj po tytule, temacie lub słowach kluczowych..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-xl font-bold text-white placeholder:text-white/20 focus:outline-none"
                        />
                        {isContextualSearch && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20 animate-fade-in">
                                <Sparkles size={14} className="text-blue-400" />
                                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Context Search Active</span>
                            </div>
                        )}
                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                            <Filter size={20} className="text-white/50" />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-white/40 tracking-widest uppercase font-bold text-sm animate-pulse">
                        Ładowanie danych...
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredVotes.length > 0 ? (
                            filteredVotes.map((vote) => (
                                <Link
                                    key={vote.id}
                                    to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
                                    className="group bg-[#111126] hover:bg-[#16162d] border border-white/5 p-6 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
                                >
                                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                        {/* Date Badge */}
                                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white/5 rounded-2xl shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                            <span className="text-xs font-bold uppercase opacity-60 group-hover:opacity-80">{new Date(vote.date).toLocaleString('default', { month: 'short' })}</span>
                                            <span className="text-2xl font-black">{new Date(vote.date).getDate()}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    Posiedzenie {vote.sitting}
                                                </span>
                                                <span className="px-3 py-1 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                    Głosowanie {vote.voting_number}
                                                </span>
                                                {/* Vote Type Badge */}
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${vote.isFinal ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-white/40'}`}>
                                                    {vote.isFinal ? 'Całość' : 'Poprawka'}
                                                </span>
                                            </div>
                                            <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight mb-2">
                                                {vote.title_clean || cleanSejmTitle(vote.title)}
                                            </h3>
                                            <p className="text-sm text-white/40 line-clamp-1">
                                                {vote.topic}
                                            </p>
                                        </div>

                                        {vote.mpVote && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5 shrink-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${vote.mpVote === 'YES' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    vote.mpVote === 'NO' ? 'bg-rose-500/10 text-rose-400' :
                                                        vote.mpVote === 'ABSTAIN' ? 'bg-amber-500/10 text-amber-400' :
                                                            'bg-white/5 text-white/30'
                                                    }`}>
                                                    {vote.mpVote === 'YES' && <CheckCircle2 size={16} />}
                                                    {vote.mpVote === 'NO' && <XCircle size={16} />}
                                                    {vote.mpVote === 'ABSTAIN' && <MinusCircle size={16} />}
                                                    {vote.mpVote === 'ABSENT' && <HelpCircle size={16} />}
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${vote.mpVote === 'YES' ? 'text-emerald-400' :
                                                    vote.mpVote === 'NO' ? 'text-rose-400' :
                                                        vote.mpVote === 'ABSTAIN' ? 'text-amber-400' :
                                                            'text-white/30'
                                                    }`}>
                                                    {vote.mpVote === 'YES' ? 'ZA' :
                                                        vote.mpVote === 'NO' ? 'PRZECIW' :
                                                            vote.mpVote === 'ABSTAIN' ? 'WSTRZYMAŁ SIĘ' :
                                                                'NIEOBECNY'
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        <div className="hidden md:block">
                                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-blue-500 group-hover:text-blue-400 transition-colors">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M5 12h14" />
                                                    <path d="M12 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-white/30 text-lg">Nie znaleziono głosowań spełniających kryteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VotesList;
