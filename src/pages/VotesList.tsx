import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface Vote {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    category: string;
    verdict: string;
    print_number: string | null;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
    };
}

const VotesList: React.FC = () => {
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchVotes();
    }, [page]);

    const fetchVotes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .table('votes')
                .select('*')
                .order('date', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

            if (error) throw error;
            setVotes(data || []);
        } catch (error) {
            console.error('Error fetching votes:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-6 md:p-12 font-sans transition-colors duration-300">
            <div className="max-w-5xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        Głosowania Sejmowe
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                        Przeglądaj wszystkie głosowania Sejmu X kadencji. Sprawdź wyniki, podział głosów w partiach i indywidualne decyzje posłów.
                    </p>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {loading && votes.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">Ładowanie głosowań...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">Brak głosowań w bazie.</div>
                    ) : (
                        votes.map((vote) => (
                            <Link
                                key={vote.id}
                                to={`/glosowania/${vote.sitting}/${vote.voting_number}`}
                                className="group block bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500"
                            >
                                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">

                                    {/* Info */}
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(vote.date)}
                                            </span>
                                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                            <span>Posiedzenie {vote.sitting}</span>
                                            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                            <span>Głosowanie {vote.voting_number}</span>
                                            {vote.print_number && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                                                    <span className="text-blue-600 dark:text-blue-400 font-medium">Druk nr {vote.print_number}</span>
                                                </>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {vote.title_clean || "Głosowanie bez tytułu"}
                                        </h3>

                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${vote.category === 'PERSONALNE/PROCEDURALNE' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                                vote.category === 'EKONOMIA' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' :
                                                    'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                                                }`}>
                                                {vote.category || 'INNE'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Verdict & Stats */}
                                    <div className="flex items-center gap-6 md:pl-6 md:border-l border-neutral-100 dark:border-neutral-700 min-w-[200px]">
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`flex items-center gap-2 text-lg font-bold ${vote.verdict === 'PRZYJĘTO' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                {vote.verdict === 'PRZYJĘTO' ? (
                                                    <>
                                                        <CheckCircle2 className="w-5 h-5" />
                                                        <span>Przyjęto</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-5 h-5" />
                                                        <span>Odrzucono</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 flex gap-3">
                                                <span className="text-green-600 dark:text-green-500 font-medium">Za: {vote.details_json?.yes || 0}</span>
                                                <span className="text-red-600 dark:text-red-500 font-medium">Przeciw: {vote.details_json?.no || 0}</span>
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
                <div className="flex justify-center gap-4 pt-8">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-6 py-2 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                        Poprzednia
                    </button>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                    >
                        Następna
                    </button>
                </div>

            </div>
        </div>
    );
};

export default VotesList;
