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

    useEffect(() => {
        if (id) fetchVote();
    }, [id]);

    const fetchVote = async () => {
        const { data, error } = await supabase
            .from('euro_votes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(error);
        } else {
            setVote(data);
        }
        setLoading(false);
    };

    if (loading) return <div className="p-12 text-center text-neutral-500">Ładowanie...</div>;
    if (!vote) return <div className="p-12 text-center text-neutral-500">Nie znaleziono głosowania.</div>;

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

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl text-amber-800 dark:text-amber-200">
                        Szczegółowe wyniki głosowania są w trakcie przetwarzania...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EuroVoteDetails;
