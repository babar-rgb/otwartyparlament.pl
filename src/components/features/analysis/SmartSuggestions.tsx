import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, FileText, Vote, MessageSquare, ArrowRight } from 'lucide-react';
import { unifiedSearch } from '../../../api';

interface Suggestion {
    type: 'mp' | 'vote' | 'process' | 'speech';
    id: string;
    title: string;
    subtitle?: string;
    url: string;
}

interface SmartSuggestionsProps {
    query: string;
    onSelect: () => void;
}

export default function SmartSuggestions({ query, onSelect }: SmartSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        const debounce = setTimeout(() => {
            fetchSuggestions(query);
        }, 300);

        return () => clearTimeout(debounce);
    }, [query]);

    async function fetchSuggestions(q: string) {
        setLoading(true);
        try {
            const data = await unifiedSearch({ q, limit: 10 } as any); // Assuming limit is supported or default

            const results: Suggestion[] = [];

            // Map backend results to Suggestion interface
            if (data.mps) {
                data.mps.slice(0, 3).forEach((mp: any) => {
                    results.push({
                        type: 'mp',
                        id: mp.id.toString(),
                        title: `${mp.first_name} ${mp.last_name}`,
                        subtitle: mp.club,
                        url: `/poslowie/${mp.id}`
                    });
                });
            }

            if (data.processes) {
                data.processes.slice(0, 2).forEach((p: any) => {
                    results.push({
                        type: 'process',
                        id: p.id.toString(),
                        title: p.title.substring(0, 80) + (p.title.length > 80 ? '...' : ''),
                        subtitle: 'Projekt ustawy',
                        url: `/projekty/${p.id}`
                    });
                });
            }

            if (data.votes) {
                data.votes.slice(0, 3).forEach((v: any) => {
                    results.push({
                        type: 'vote',
                        id: v.id.toString(),
                        title: (v.title_clean || v.title_raw).substring(0, 80) + (v.title_clean?.length > 80 ? '...' : ''),
                        subtitle: v.verdict,
                        url: `/glosowanie/${v.id}`
                    });
                });
            }

            setSuggestions(results);
        } catch (err) {
            console.error('Suggestion error:', err);
        } finally {
            setLoading(false);
        }
    }

    const getIcon = (type: Suggestion['type']) => {
        switch (type) {
            case 'mp': return <User className="w-5 h-5" />;
            case 'vote': return <Vote className="w-5 h-5" />;
            case 'process': return <FileText className="w-5 h-5" />;
            case 'speech': return <MessageSquare className="w-5 h-5" />;
        }
    };

    const getColor = (type: Suggestion['type']) => {
        switch (type) {
            case 'mp': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'vote': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
            case 'process': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
            case 'speech': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400';
        }
    };

    if (query.length < 2) return null;

    if (loading) {
        return (
            <div className="mt-6 p-6 text-center text-slate-400 dark:text-slate-500">
                <div className="animate-pulse">Szukam...</div>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return (
            <div className="mt-6 p-6 text-center text-slate-400 dark:text-slate-500">
                Brak wyników dla "{query}"
            </div>
        );
    }

    const grouped = suggestions.reduce((acc, s) => {
        if (!acc[s.type]) acc[s.type] = [];
        acc[s.type].push(s);
        return acc;
    }, {} as Record<string, Suggestion[]>);

    return (
        <div className="mt-6 space-y-6">
            {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <span className={`p-1.5 rounded-lg ${getColor(type as Suggestion['type'])}`}>
                            {getIcon(type as Suggestion['type'])}
                        </span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {type === 'mp' ? 'Posłowie' : type === 'vote' ? 'Głosowania' : type === 'process' ? 'Projekty Ustaw' : 'Wypowiedzi'}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {items.map((item) => (
                            <Link
                                key={`${item.type}-${item.id}`}
                                to={item.url}
                                onClick={onSelect}
                                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                <div className="flex-grow min-w-0">
                                    <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {item.title}
                                    </div>
                                    {item.subtitle && (
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            {item.subtitle}
                                        </div>
                                    )}
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0 ml-4" />
                            </Link>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
