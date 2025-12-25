import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';
import { Search, Filter, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { useTerm } from '../context/TermContext';

const EuroVotes = () => {
    const { term } = useTerm();
    const [votes, setVotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState('Wszystkie');
    const [showKeyOnly, setShowKeyOnly] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const LIMIT = 20;

    // Distinct tags for filter (could be dynamic)
    const availableTags = [
        'Wszystkie',
        'ROLNICTWO', 'KLIMAT', 'BUDŻET', 'PRAWO', 'ZEWNĘTRZNE', 'TRANSPORT', 'GOSPODARKA', 'INNE'
    ];

    useEffect(() => {
        // Reset list when filters change
        setVotes([]);
        setPage(0);
        setHasMore(true);
        fetchVotes(0, true);
    }, [searchTerm, selectedTag, term, showKeyOnly]);

    const fetchVotes = async (pageIndex: number, listsReset = false) => {
        setLoading(true);
        try {
            let query = db
                .from('euro_votes')
                .select('*')
                .eq('term', term)
                .order('date', { ascending: false })
                .range(pageIndex * LIMIT, (pageIndex + 1) * LIMIT - 1);

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            if (selectedTag !== 'Wszystkie') {
                query = query.eq('topic_tag', selectedTag);
            }

            if (showKeyOnly) {
                query = query.eq('is_key_vote', true);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                if (data.length < LIMIT) setHasMore(false);
                setVotes(prev => listsReset ? data : [...prev, ...data]);
            }
        } catch (error) {
            console.error('Error fetching votes:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchVotes(nextPage, false);
    };

    return (
        <div className="min-h-screen bg-paper dark:bg-slate-900 text-neutral-900 dark:text-white font-sans transition-colors duration-300 pt-28 pb-12 px-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/europarlament" className="inline-flex items-center gap-2 text-neutral-500 hover:text-blue-600 transition-colors mb-2">
                            <ArrowLeft className="w-4 h-4" />
                            Wróć do Panelu
                        </Link>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">
                            Archiwum Głosowań PE
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Przeglądaj wszystkie głosowania Parlamentu Europejskiego
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Szukaj głosowania..."
                                className="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-indigo-800 bg-white dark:bg-[#24243e] outline-none focus:ring-2 focus:ring-blue-500 w-full transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>



                {/* Filters Row */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-neutral-200 dark:border-white/10 pb-4">
                    <div className="flex flex-wrap gap-2">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${selectedTag === tag
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white dark:bg-[#24243e] text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:border-blue-400'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showKeyOnly}
                            onChange={e => setShowKeyOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Tylko Kluczowe</span>
                    </label>
                </div>

                {/* Grid */}
                {votes.length === 0 && !loading ? (
                    <div className="py-20 text-center text-neutral-500">
                        Nie znaleziono głosowań spełniających kryteria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {votes.map(v => (
                            <Link
                                to={`/europarlament/glosowanie/${encodeURIComponent(v.id)}`}
                                key={v.id}
                                className="bg-white dark:bg-[#24243e] p-6 rounded-2xl border border-neutral-200 dark:border-indigo-900/50 shadow-sm hover:border-blue-400 dark:hover:border-blue-500/50 transition-all hover:shadow-md block group relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                                            <span className="font-mono bg-neutral-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{new Date(v.date).toLocaleDateString('pl-PL')}</span>
                                            <span>•</span>
                                            <span>ID: {v.id}</span>
                                        </div>
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {v.title}
                                        </h3>
                                        {v.description && (
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                {v.description.replace(/ \| .*$/, '')}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            {v.topic_tag && (
                                                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded uppercase border border-blue-100 dark:border-blue-800">
                                                    {v.topic_tag}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                        <span className="group-hover:translate-x-1 transition-transform">Szczegóły →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && (
                    <div className="text-center pt-8">
                        <button
                            onClick={loadMore}
                            disabled={loading}
                            className="px-8 py-3 bg-white dark:bg-[#24243e] border border-neutral-200 dark:border-indigo-800 rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Załaduj więcej'}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

export default EuroVotes;
