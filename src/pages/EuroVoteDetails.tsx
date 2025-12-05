import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Calendar } from 'lucide-react';

interface EuroVote {
    id: string;
    title: string;
    date: string;
}

const EuroVoteDetails: React.FC = () => {
    const { id } = useParams();
    const [vote, setVote] = useState<EuroVote | null>(null);
    const [loading, setLoading] = useState(true);

    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            fetchVote();
            fetchResults();
        }
    }, [id]);

    const fetchVote = async () => {
        const { data, error } = await supabase
            .from('euro_votes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) console.error(error);
        else setVote(data);
        setLoading(false);
    };

    const fetchResults = async () => {
        const { data, error } = await supabase
            .from('euro_vote_results')
            .select('*, mep:euro_meps(full_name, national_party, photo_url)')
            .eq('vote_id', id);

        if (error) console.error(error);
        else setResults(data || []);
    };

    if (loading) return <div className="p-12 text-center text-neutral-500">Ładowanie...</div>;
    if (!vote) return <div className="p-12 text-center text-neutral-500">Nie znaleziono głosowania.</div>;

    // Calculate stats
    const stats = {
        for: results.filter(r => r.vote === 'For').length,
        against: results.filter(r => r.vote === 'Against').length,
        abstain: results.filter(r => r.vote === 'Abstain').length,
        absent: results.filter(r => r.vote === 'Absent').length,
    };

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#1a1f36] text-neutral-900 dark:text-white p-6 md:p-12 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link to="/europarlament" className="inline-flex items-center gap-2 text-neutral-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Wróć do Europarlamentu
                </Link>

                <div className="bg-white dark:bg-[#24243e] rounded-3xl p-8 shadow-sm border border-neutral-200 dark:border-indigo-900/50">
                    <div className="flex items-center gap-2 text-sm text-neutral-500 mb-4">
                        <Calendar className="w-4 h-4" />
                        {new Date(vote.date).toLocaleDateString('pl-PL')}
                        <span className="text-neutral-300">|</span>
                        <span>ID: {vote.id}</span>
                    </div>

                    <h1 className="text-3xl font-bold leading-tight mb-6">
                        {vote.title}
                    </h1>

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-200 dark:border-green-800">
                            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.for}</div>
                            <div className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase">Za</div>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center border border-red-200 dark:border-red-800">
                            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.against}</div>
                            <div className="text-xs font-semibold text-red-600 dark:text-red-500 uppercase">Przeciw</div>
                        </div>
                        <div className="bg-neutral-50 dark:bg-white/5 p-4 rounded-xl text-center border border-neutral-200 dark:border-white/10">
                            <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-400">{stats.abstain}</div>
                            <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-500 uppercase">Wstrzymał się</div>
                        </div>
                    </div>

                    {results.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Wyniki imienne (Polska delegacja)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {results.map(r => (
                                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10">
                                        <div className={`w-2 h-2 rounded-full ${r.vote === 'For' ? 'bg-green-500' :
                                                r.vote === 'Against' ? 'bg-red-500' :
                                                    'bg-neutral-400'
                                            }`} />
                                        <img src={r.mep?.photo_url} className="w-8 h-8 rounded-full object-cover bg-neutral-200" alt="" />
                                        <div>
                                            <div className="font-semibold text-sm">{r.mep?.full_name || 'Nieznany poseł'}</div>
                                            <div className="text-xs text-neutral-500 dark:text-neutral-400">{r.mep?.national_party}</div>
                                        </div>
                                        <div className="ml-auto text-xs font-bold opacity-70">
                                            {r.vote === 'For' ? 'ZA' : r.vote === 'Against' ? 'PRZECIW' : r.vote}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-200">
                            Szczegółowe wyniki tego głosowania są jeszcze przetwarzane. Spróbuj odświeżyć za chwilę.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EuroVoteDetails;
