import React, { useState } from 'react';
import { Search, Sparkles, FileText, Vote, MessageCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
    id: number;
    type: 'vote' | 'bill' | 'interpellation';
    title: string;
    description?: string;
    similarity: number;
    url: string;
}

export default function SemanticSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (query.length < 3) return;

        setLoading(true);
        setSearched(true);

        try {
            const response = await fetch(`/api/semantic/search?q=${encodeURIComponent(query)}&limit=50`);
            const data = await response.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'vote':
                return <Vote size={16} className="text-blue-500" />;
            case 'bill':
                return <FileText size={16} className="text-amber-500" />;
            case 'interpellation':
                return <MessageCircle size={16} className="text-purple-500" />;
            default:
                return null;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'vote':
                return 'Głosowanie';
            case 'bill':
                return 'Druk';
            case 'interpellation':
                return 'Interpelacja';
            default:
                return type;
        }
    };

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'vote':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'bill':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'interpellation':
                return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            default:
                return 'bg-white/5 text-secondary border-white/10';
        }
    };

    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                        <Sparkles size={16} className="text-indigo-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-500">
                            AI-Powered Search
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-white mb-4">
                        Wyszukiwanie Semantyczne
                    </h1>
                    <p className="text-lg text-secondary max-w-2xl mx-auto">
                        Znajdź głosowania, druki i interpelacje po znaczeniu, nie tylko po słowach kluczowych.
                        Wpisz np. "podatki dla firm" lub "ochrona środowiska".
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Szukaj po znaczeniu... (np. 'podatki dla przedsiębiorców')"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-secondary/50 focus:outline-none focus:border-indigo-500/50 transition-colors"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || query.length < 3}
                        className="mt-4 w-full px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/5 disabled:text-secondary/50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Szukam...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Szukaj semantycznie
                            </>
                        )}
                    </button>
                </form>

                {/* Results */}
                {searched && (
                    <div>
                        {loading ? (
                            <div className="text-center py-12">
                                <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
                                <p className="text-secondary">Analizuję znaczenie zapytania...</p>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white">
                                        Znaleziono {results.length} wyników
                                    </h2>
                                    <span className="text-sm text-secondary">
                                        Posortowane po trafności
                                    </span>
                                </div>

                                {results.map((result) => (
                                    <div
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => navigate(result.url)}
                                        className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors">
                                                {getTypeIcon(result.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getTypeBadgeColor(result.type)}`}>
                                                        {getTypeLabel(result.type)}
                                                    </span>
                                                    <span className="text-xs text-secondary">
                                                        {Math.round(result.similarity * 100)}% trafności
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                                    {result.title}
                                                </h3>

                                                {result.description && (
                                                    <p className="text-sm text-secondary line-clamp-2">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <Search size={48} className="text-secondary/30 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Brak wyników
                                </h3>
                                <p className="text-secondary">
                                    Spróbuj innego zapytania lub sprawdź, czy embeddingi zostały wygenerowane.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Examples */}
                {!searched && (
                    <div className="mt-12 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                        <h3 className="text-sm font-black uppercase tracking-wider text-secondary mb-4">
                            Przykładowe zapytania:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                'podatki dla małych firm',
                                'ochrona środowiska i klimat',
                                'edukacja i szkoły',
                                'służba zdrowia i szpitale',
                                'bezpieczeństwo i policja',
                                'transport i infrastruktura'
                            ].map((example) => (
                                <button
                                    key={example}
                                    onClick={() => setQuery(example)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 rounded-lg text-sm text-secondary hover:text-white transition-all text-left"
                                >
                                    "{example}"
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
