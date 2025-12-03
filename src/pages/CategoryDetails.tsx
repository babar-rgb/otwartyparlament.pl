import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Vote {
    id: number;
    sitting: number;
    voting_number: number;
    date: string;
    title_clean: string;
    category: string;
    verdict: string;
    description?: string;
    details_json: {
        yes: number;
        no: number;
        abstain: number;
    };
}

export default function CategoryDetails() {
    const { slug } = useParams<{ slug: string }>();
    const [votes, setVotes] = useState<Vote[]>([]);
    const [loading, setLoading] = useState(true);

    // Helper to format slug into title (e.g., "polityka-spoleczna" -> "Polityka Społeczna")
    const formatTitle = (s: string) => {
        return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const title = slug ? formatTitle(slug) : 'Kategoria';

    // Map slug to DB category (simple mapping for now, can be improved)
    // DB categories are uppercase, e.g., "ROLNICTWO", "EKONOMIA"
    const mapSlugToCategory = (s: string) => {
        const mapping: Record<string, string> = {
            'rolnictwo': 'ROLNICTWO',
            'gospodarka': 'EKONOMIA',
            'zdrowie': 'ZDROWIE',
            'edukacja': 'EDUKACJA',
            'obronnosc': 'OBRONNOŚĆ',
            'sprawiedliwosc': 'SPRAWIEDLIWOŚĆ',
            'infrastruktura': 'INFRASTRUKTURA',
            'energetyka': 'ENERGETYKA',
            'polityka-spoleczna': 'POLITYKA SPOŁECZNA',
            'unia-europejska': 'UNIA EUROPEJSKA',
            'cyfryzacja': 'CYFRYZACJA',
            'srodowisko': 'ŚRODOWISKO',
            'kultura': 'KULTURA',
        };
        return mapping[s.toLowerCase()] || s.toUpperCase();
    };

    useEffect(() => {
        if (slug) {
            fetchVotes();
        }
    }, [slug]);

    const fetchVotes = async () => {
        setLoading(true);
        try {
            const category = mapSlugToCategory(slug || '');

            // Fetch votes for this category
            // Note: We are using 'ilike' for case-insensitive partial match if exact match fails, 
            // or just exact match if we are confident. Let's try exact match first.
            const { data, error } = await supabase
                .table('votes')
                .select('*')
                .ilike('category', `%${category}%`)
                .order('date', { ascending: false })
                .limit(50);

            if (error) throw error;
            setVotes(data || []);
        } catch (error) {
            console.error('Error fetching category votes:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: votes.length,
        accepted: votes.filter(v => v.verdict === 'PRZYJĘTO').length,
        rejected: votes.filter(v => v.verdict !== 'PRZYJĘTO').length,
    };

    return (
        <div className="min-h-screen bg-paper py-12 px-6">
            <div className="container mx-auto max-w-5xl">

                {/* Breadcrumbs */}
                <Link to="/" className="inline-flex items-center text-ink-light hover:text-brand transition mb-8 group">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Wróć do strony głównej
                </Link>

                {/* Hero Section */}
                <div className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-ink mb-4 tracking-tight">
                        {title}
                    </h1>
                    <p className="text-xl text-ink-light max-w-2xl mb-8">
                        Przegląd legislacji, kluczowych głosowań i debat w obszarze: {title}.
                    </p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Liczba Głosowań</p>
                                <p className="text-3xl font-bold text-ink">{loading ? '-' : stats.total}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Przyjęte</p>
                                <p className="text-3xl font-bold text-ink">{loading ? '-' : stats.accepted}</p>
                            </div>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-xl flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 uppercase tracking-wide font-bold">Odrzucone</p>
                                <p className="text-3xl font-bold text-ink">{loading ? '-' : stats.rejected}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Votes List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-ink mb-6 border-b border-gray-200 pb-4">
                        Ostatnie Głosowania
                    </h2>

                    {loading ? (
                        <div className="text-center py-12 text-neutral-500">Ładowanie...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">Brak głosowań w tej kategorii.</div>
                    ) : (
                        votes.map((vote, index) => (
                            <Link
                                key={vote.id}
                                to={`/glosowania/${vote.sitting}/${vote.voting_number}`}
                                className="block group bg-white p-6 rounded-xl border border-gray-200 hover:border-brand/50 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-2xl font-bold text-gray-300 font-serif">
                                        {(index + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-ink group-hover:text-brand transition-colors mb-2">
                                            {vote.title_clean}
                                        </h3>
                                        <p className="text-slate-600 mb-4 line-clamp-2">
                                            {vote.description || 'Brak opisu.'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-500">
                                                {new Date(vote.date).toLocaleDateString('pl-PL')}
                                            </span>
                                            <div className="flex items-center gap-4 text-sm font-medium">
                                                <span className="text-green-600">ZA: {vote.details_json?.yes || 0}</span>
                                                <span className="text-red-600">PRZECIW: {vote.details_json?.no || 0}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs uppercase ${vote.verdict === 'PRZYJĘTO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {vote.verdict}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
