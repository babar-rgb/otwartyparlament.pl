import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, ChevronRight, TrendingUp, X, Lightbulb } from 'lucide-react';
import { expandSearchQuery, getCategorySuggestions, CONTEXT_MAP } from '../utils/searchContext';

interface SmartSearchProps {
    initialQuery?: string;
    onSearch?: (query: string, expandedTerms: string[]) => void;
    size?: 'small' | 'large';
    showHero?: boolean;
}

// Popular search examples
const SEARCH_EXAMPLES = [
    { query: 'drożyzna', description: 'znajdzie ustawy o inflacji i cenach' },
    { query: 'kredyt mieszkanie', description: 'bezpieczny kredyt, hipoteki' },
    { query: '500+', description: 'świadczenia na dzieci' },
    { query: 'emerytura', description: 'ZUS, renty, waloryzacja' },
    { query: 'klimat', description: 'energia, OZE, emisje' },
];

export default function SmartSearch({
    initialQuery = '',
    onSearch,
    size = 'large',
    showHero = true
}: SmartSearchProps) {
    const navigate = useNavigate();
    const [query, setQuery] = useState(initialQuery);
    const [expandedTerms, setExpandedTerms] = useState<string[]>([]);
    const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [showExamples, setShowExamples] = useState(false);

    // Debounced context expansion
    useEffect(() => {
        if (query.length >= 2) {
            const terms = expandSearchQuery(query);
            const originalWords = query.toLowerCase().split(/\s+/);
            // Only show terms that were added (not original)
            const addedTerms = terms.filter(t => !originalWords.includes(t));
            setExpandedTerms(addedTerms.slice(0, 8)); // Limit shown

            const cats = getCategorySuggestions(query);
            setCategorySuggestions(cats);
        } else {
            setExpandedTerms([]);
            setCategorySuggestions([]);
        }
    }, [query]);

    const handleSearch = useCallback(() => {
        if (!query.trim()) return;

        if (onSearch) {
            onSearch(query, expandedTerms);
        } else {
            // Navigate to search page with expanded query
            const allTerms = expandSearchQuery(query);
            navigate(`/szukaj?q=${encodeURIComponent(query)}&expanded=${encodeURIComponent(allTerms.join(','))}`);
        }
    }, [query, expandedTerms, onSearch, navigate]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        setShowExamples(false);
    };

    const isSmall = size === 'small';

    return (
        <div className={`w-full ${showHero && !isSmall ? 'max-w-3xl mx-auto' : ''}`}>
            {/* Hero Header */}
            {showHero && !isSmall && (
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white mb-6 shadow-lg">
                        <Search size={32} />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white mb-4">
                        Inteligentna Wyszukiwarka
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
                        Wpisz hasło <span className="font-bold text-amber-600">"drożyzna"</span>, a znajdziemy ustawy o inflacji.{' '}
                        <span className="text-neutral-500">Rozumiemy kontekst, nie tylko słowa.</span>
                    </p>
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <div className={`
          relative flex items-center gap-3
          ${isSmall ? 'px-4 py-2' : 'px-6 py-4'}
          bg-white dark:bg-neutral-800 
          rounded-2xl
          border-2 ${isFocused ? 'border-amber-400 shadow-lg shadow-amber-100 dark:shadow-amber-900/20' : 'border-neutral-200 dark:border-neutral-700'}
          transition-all duration-200
        `}>
                    <Search className={`${isSmall ? 'w-5 h-5' : 'w-6 h-6'} text-neutral-400`} />

                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { setIsFocused(true); setShowExamples(true); }}
                        onBlur={() => { setIsFocused(false); setTimeout(() => setShowExamples(false), 200); }}
                        placeholder="Szukaj głosowań, ustaw, tematów..."
                        className={`
              flex-1 bg-transparent outline-none
              ${isSmall ? 'text-base' : 'text-lg'}
              text-neutral-900 dark:text-white
              placeholder-neutral-400
            `}
                    />

                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors"
                        >
                            <X size={18} className="text-neutral-400" />
                        </button>
                    )}

                    <button
                        onClick={handleSearch}
                        className={`
              flex items-center gap-2
              ${isSmall ? 'px-4 py-2 text-sm' : 'px-6 py-3'}
              bg-gradient-to-r from-amber-500 to-orange-600 
              hover:from-amber-600 hover:to-orange-700
              text-white font-bold rounded-xl
              transition-all duration-200 hover:shadow-lg
            `}
                    >
                        <Sparkles size={isSmall ? 16 : 18} />
                        <span className={isSmall ? 'hidden sm:inline' : ''}>Szukaj</span>
                    </button>
                </div>

                {/* Expanded Context Terms */}
                {expandedTerms.length > 0 && isFocused && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl z-50">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={16} className="text-amber-500" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Rozumiemy kontekst — szukamy również:
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {expandedTerms.map((term, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full"
                                >
                                    {term}
                                </span>
                            ))}
                        </div>

                        {categorySuggestions.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                                <p className="text-xs text-neutral-500 mb-2">Sugerowane kategorie:</p>
                                <div className="flex flex-wrap gap-2">
                                    {categorySuggestions.map((cat, i) => (
                                        <button
                                            key={i}
                                            onClick={() => navigate(`/glosowania?category=${cat}`)}
                                            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full hover:bg-blue-200 transition-colors"
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search Examples */}
                {showExamples && !query && (
                    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-xl z-50">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} className="text-green-500" />
                            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Popularne wyszukiwania
                            </span>
                        </div>
                        <div className="space-y-2">
                            {SEARCH_EXAMPLES.map((example, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleExampleClick(example.query)}
                                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-left group"
                                >
                                    <div>
                                        <span className="font-medium text-neutral-900 dark:text-white group-hover:text-amber-600">
                                            {example.query}
                                        </span>
                                        <span className="text-sm text-neutral-500 ml-2">
                                            → {example.description}
                                        </span>
                                    </div>
                                    <ChevronRight size={16} className="text-neutral-400 group-hover:text-amber-600" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Stats (only in hero mode) */}
            {showHero && !isSmall && (
                <div className="flex items-center justify-center gap-6 mt-6 text-sm text-neutral-500">
                    <span>🧠 {Object.keys(CONTEXT_MAP).length}+ pojęć z kontekstem</span>
                    <span>•</span>
                    <span>🔍 Rozszerzone wyszukiwanie</span>
                    <span>•</span>
                    <span>📊 12,000+ głosowań</span>
                </div>
            )}
        </div>
    );
}
