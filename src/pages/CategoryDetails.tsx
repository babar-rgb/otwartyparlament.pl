import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useCategoryDetails } from '../hooks/useCategoryDetails';

export default function CategoryDetails() {
    const { slug } = useParams<{ slug: string }>();
    const [showKeyOnly, setShowKeyOnly] = useState(true);

    const formatTitle = (s: string) => {
        return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    function mapSlugToTitle(s: string) {
        const mapping: Record<string, string> = {
            'rolnictwo': 'Rolnictwo',
            'gospodarka': 'Gospodarka',
            'zdrowie': 'Zdrowie',
            'edukacja': 'Edukacja',
            'obronnosc': 'Obronność',
            'sprawiedliwosc': 'Sprawiedliwość',
            'infrastruktura': 'Infrastruktura',
            'energetyka': 'Energetyka',
            'polityka-spoleczna': 'Polityka Społeczna',
            'unia-europejska': 'Unia Europejska',
            'cyfryzacja': 'Cyfryzacja',
            'srodowisko': 'Środowisko',
            'kultura': 'Kultura',
        };
        return mapping[s.toLowerCase()] || formatTitle(s);
    }

    const title = useMemo(() => slug ? mapSlugToTitle(slug) : 'Kategoria', [slug]);

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

    const categoryName = useMemo(() => slug ? mapSlugToCategory(slug) : '', [slug]);
    const { data, isLoading: loading } = useCategoryDetails(categoryName, showKeyOnly);

    const votes = data?.votes || [];
    const stats = data?.stats || { total: 0, accepted: 0, rejected: 0 };

    return (
        <div className="min-h-screen bg-paper pt-32 pb-12 px-6">
            <SEO
                title={`${title} - Głosowania i Ustawy`}
                description={`Przegląd legislacji, kluczowych głosowań i debat w obszarze: ${title}. Sprawdź jak głosowano w sprawach kategorii ${title}.`}
            />
            <div className="container mx-auto max-w-5xl">

                <Link to="/" className="inline-flex items-center text-ink-light hover:text-brand transition mb-8 group">
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Wróć do strony głównej
                </Link>

                <div className="mb-16 animate-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-ink mb-4 tracking-tight">
                        {title}
                    </h1>
                    <p className="text-xl text-ink-light max-w-2xl mb-8">
                        Przegląd legislacji, kluczowych głosowań i debat w obszarze: {title}.
                    </p>

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

                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                        <h2 className="text-2xl font-bold text-ink">
                            {showKeyOnly ? 'Kluczowe Głosowania' : 'Wszystkie Głosowania'}
                        </h2>
                        <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                            <button
                                onClick={() => setShowKeyOnly(true)}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${showKeyOnly ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}
                            >
                                Ważne
                            </button>
                            <button
                                onClick={() => setShowKeyOnly(false)}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${!showKeyOnly ? 'bg-brand text-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}
                            >
                                Wszystkie
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-neutral-500">Ładowanie...</div>
                    ) : votes.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">
                            {showKeyOnly ? 'Brak kluczowych głosowań w tej kategorii.' : 'Brak głosowań w tej kategorii.'}
                        </div>
                    ) : (
                        votes.map((vote, index) => (
                            <Link
                                key={vote.id}
                                to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
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
