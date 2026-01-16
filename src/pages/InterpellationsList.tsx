import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, FileText, ArrowRight } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { formatPolishDate } from '../utils/dateUtils';
import { useInterpellationsList } from '../hooks/useInterpellationsList';
import SEO from '../components/SEO';

interface Interpellation {
    id: number;
    term: number;
    title: string;
    sent_date: string;
    last_modified: string;
    content: string;
    reply_content: string;
    raw_data: {
        content?: string;
        key?: string;
        num?: number;
        from?: string[];
        to?: string[];
        [key: string]: any;
    };
}

const highlightText = (text: string, highlight: string) => {
    if (!text) return '';
    if (!highlight.trim()) return text.slice(0, 300) + '...';
    const safe = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safe})`, 'gi');
    const match = regex.exec(text);
    if (!match) return text.slice(0, 300) + '...';
    const start = Math.max(0, match.index - 60);
    const end = Math.min(text.length, match.index + highlight.length + 240);
    let snippet = text.slice(start, end);
    snippet = snippet.replace(regex, (m) => `<mark class="bg-yellow-200 font-bold rounded px-1">${m}</mark>`);
    return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
};

export default function InterpellationsList() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get('q') || '';
    const mpIdFilter = searchParams.get('mp_id');

    const [query, setQuery] = useState(queryParam);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    const {
        interpellations,
        totalCount,
        mpName: filterMpName,
        loading
    } = useInterpellationsList({
        mpId: mpIdFilter,
        page,
        pageSize: ITEMS_PER_PAGE,
        query: queryParam
    });

    const hasSearched = !!queryParam;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        if (query.trim()) params.q = query;
        if (mpIdFilter) params.mp_id = mpIdFilter;
        setSearchParams(params);
        setPage(1);
    };

    useEffect(() => {
        setPage(1);
    }, [mpIdFilter, queryParam]);

    return (
        <div className="min-h-screen bg-page text-primary pb-16">
            <SEO
                title={mpIdFilter && filterMpName ? `Interpelacje: ${filterMpName}` : queryParam ? `Wyniki: "${queryParam}"` : "Wyszukiwarka Interpelacji"}
                description={`Przeszukaj bazę ${totalCount.toLocaleString()} zapytań i interpelacji poselskich. Analizuj aktywność parlamentarną w czasie rzeczywistym.`}
                url="/interpelacje"
            />
            <div className="animate-fade-in">
                {/* Hero Section */}
                <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base bg-page">
                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="flex-1">
                                <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                                    Wyszukiwarka <span className="italic font-serif text-accent-blue/80">interpelacji</span>
                                </h1>
                                <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                                    Przeszukaj bazę <span className="text-primary font-black">{totalCount.toLocaleString()}</span> zapytań i interpelacji poselskich. Analizuj aktywność parlamentarną w czasie rzeczywistym.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
                    {/* Search Panel */}
                    <div className="bg-surface p-6 rounded-[var(--radius-card-xl)] border border-border-base mb-10 shadow-2xl backdrop-blur-md">
                        <form onSubmit={handleSearch} className="relative group">
                            <div className="relative flex items-center gap-4">
                                <Search className="text-secondary/30" size={24} />
                                <input
                                    type="text"
                                    placeholder="Szukaj po tytule, treści lub autorze..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-slate-400 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-accent-blue text-white font-black rounded-[var(--radius-badge)] uppercase tracking-wider text-xs transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? '...' : 'SZUKAJ'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-base/50">
                            <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                                <FileText className="text-accent-blue" />
                                {mpIdFilter && filterMpName
                                    ? `Interpelacje: ${filterMpName}`
                                    : hasSearched && query
                                        ? `Wyniki dla: "${query}"`
                                        : 'Ostatnio złożone'}
                            </h2>
                        </div>

                        <div className="grid gap-6">
                            {interpellations.length === 0 && !loading && (
                                <EmptyState
                                    title="Brak interpelacji"
                                    description="Nie znaleziono zapytań spełniających podane kryteria."
                                    icon="file"
                                />
                            )}
                            {interpellations.map((item: Interpellation) => {
                                const authorList = item.raw_data?.from || [];
                                const authorName = (item as any).authors?.length > 0
                                    ? (item as any).authors.map((a: any) => `${a.first_name} ${a.last_name}`).join(', ')
                                    : (Array.isArray(authorList) ? (authorList[0] || 'Nieznany poseł') : authorList);

                                const contentText = item.content || item.raw_data?.content || item.title;

                                return (
                                    <Link key={item.id} to={`/interpelacje/${item.id}`} className="group block bg-surface p-6 md:p-8 rounded-[var(--radius-card-md)] border border-border-base shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-accent-blue border border-border-base/50">
                                                    <FileText size={22} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-primary text-lg leading-tight">{authorName}</p>
                                                    <p className="text-[10px] font-black text-secondary opacity-50 uppercase mt-0.5">Nr {item.raw_data?.num || item.id}</p>
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-lg border border-border-base">
                                                <span className="text-[11px] font-black text-secondary uppercase tracking-widest">
                                                    {formatPolishDate(item.sent_date)}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-primary mb-4 leading-tight group-hover:text-accent-blue transition-colors">{item.title}</h3>
                                        <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                                            <p className="text-secondary leading-relaxed line-clamp-2 text-sm font-medium italic opacity-70"
                                                dangerouslySetInnerHTML={{ __html: query ? highlightText(contentText || '', query) : ((contentText || '').slice(0, 200) + '...') }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-[0.2em] transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                            Szczegóły Interpelacji <ArrowRight size={14} />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {(!hasSearched || !query) && (
                            <div className="flex justify-center items-center gap-4 pt-8">
                                <button
                                    onClick={() => {
                                        setPage(p => Math.max(1, p - 1));
                                        window.scrollTo({ top: 0, behavior: 'instant' });
                                    }}
                                    disabled={page === 1 || loading}
                                    className="px-6 py-3 rounded-xl bg-surface border border-border-base hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-black text-xs uppercase tracking-widest"
                                >
                                    Poprzednia
                                </button>
                                <span className="font-black text-sm text-secondary">
                                    Strona {page}
                                </span>
                                <button
                                    onClick={() => {
                                        setPage(p => p + 1);
                                        window.scrollTo({ top: 0, behavior: 'instant' });
                                    }}
                                    disabled={loading || interpellations.length < ITEMS_PER_PAGE}
                                    className="px-6 py-3 rounded-xl bg-surface border border-border-base hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-black text-xs uppercase tracking-widest"
                                >
                                    Następna
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
