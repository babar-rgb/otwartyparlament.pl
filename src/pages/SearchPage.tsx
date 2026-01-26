import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, Mic, FileText, Vote as VoteIcon, User, Layers, Calendar, ChevronRight } from 'lucide-react';
import { useUnifiedSearch } from '../hooks/useUnifiedSearch';
import { SearchResult } from '../types/domain';

export default function SearchPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    // Filters could be expanded here if we want local state, but URL params are better for sharing

    const { data, isLoading } = useUnifiedSearch(
        query,
        searchParams.get('period') || 'all',
        searchParams.get('type') || null,
        searchParams.get('expanded') || undefined
    );

    // Provide default empty arrays if data is undefined
    const mps = (data?.mps || []) as import('../types/domain').MP[];
    const results: SearchResult[] = data?.results || [];

    // Grouping results for UI using typed filter
    const processes = results.filter((r) => r.type === 'process');
    const votes = results.filter((r) => r.type === 'vote');
    const speeches = results.filter((r) => r.type === 'speech');
    const interpellations = results.filter((r) => r.type === 'interpellation');

    return (
        <div className="min-h-screen bg-page pt-32 pb-12 px-4 md:px-8 text-primary">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="space-y-4 text-center md:text-left">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-primary">
                        Wyniki dla <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">"{query}"</span>
                    </h1>
                    <p className="text-secondary text-lg">Znaleziono {mps.length + results.length} wyników w bazie danych</p>
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {[
                        { label: 'Wszystkie', icon: Layers, type: null },
                        { label: 'Posłowie', icon: User, type: 'mp', count: mps.length },
                        { label: 'Projekty', icon: FileText, type: 'process', count: processes.length },
                        { label: 'Głosowania', icon: VoteIcon, type: 'vote', count: votes.length },
                        { label: 'Interpelacje', icon: Search, type: 'interpellation', count: results.filter(r => r.type === 'interpellation').length },
                        { label: 'Wypowiedzi', icon: Mic, type: 'speech', count: speeches.length },
                    ].map((type) => (
                        <button
                            key={type.label}
                            onClick={() => {
                                const newParams = new URLSearchParams(searchParams);
                                if (type.type) newParams.set('type', type.type);
                                else newParams.delete('type');
                                navigate(`/search?${newParams.toString()}`);
                            }}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${(type.type === searchParams.get('type') || (!type.type && !searchParams.get('type')))
                                ? 'bg-primary text-background border-primary'
                                : 'bg-surface text-secondary border-border-base hover:border-primary/30'
                                }`}
                        >
                            <type.icon size={16} />
                            <span className="text-sm font-bold uppercase tracking-wider">{type.label}</span>
                            {type.count !== undefined && (
                                <span className="ml-1 px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded-md text-xs">{type.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-24 text-secondary text-lg font-medium animate-pulse">
                        Przeszukiwanie bazy danych Sejmu...
                    </div>
                )}

                {!isLoading && (
                    <div className="space-y-16">
                        {/* MPs Section */}
                        {mps.length > 0 && (!searchParams.get('type') || searchParams.get('type') === 'mp') && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <User className="text-accent-blue" size={24} />
                                    <h2 className="text-2xl font-black tracking-tight">Posłowie</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {mps.map((mp) => (
                                        <Link to={`/poslowie/${mp.id}`} key={mp.id} className="group bg-surface p-4 rounded-2xl border border-border-base hover:border-accent-blue/30 transition-all flex items-center gap-4">
                                            <img
                                                src={mp.photo_url}
                                                className="w-12 h-12 rounded-full object-cover bg-page"
                                                alt={mp.first_name + ' ' + mp.last_name}
                                            />
                                            <div>
                                                <div className="font-bold text-primary group-hover:text-accent-blue transition-colors">{mp.first_name} {mp.last_name}</div>
                                                <div className="text-xs text-secondary font-medium uppercase tracking-wider">{mp.club}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Votes Section */}
                        {votes.length > 0 && (!searchParams.get('type') || searchParams.get('type') === 'vote') && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <VoteIcon className="text-emerald-500" size={24} />
                                    <h2 className="text-2xl font-black tracking-tight">Głosowania</h2>
                                </div>
                                <div className="grid gap-4">
                                    {votes.map((vote) => (
                                        <Link to={`/glosowanie/${vote.id}`} key={vote.id} className="group block bg-surface p-6 rounded-2xl border border-border-base hover:border-emerald-500/30 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                                                            {vote.ux_category || 'Głosowanie'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-secondary font-mono">
                                                            <Calendar size={12} />
                                                            {vote.date}
                                                        </span>
                                                        {vote.sitting && (
                                                            <span className="px-2 py-1 bg-page border border-border-base text-secondary text-[10px] uppercase font-bold tracking-wider rounded-md">
                                                                Posiedzenie {vote.sitting}
                                                            </span>
                                                        )}
                                                        {vote.voting_number && (
                                                            <span className="px-2 py-1 bg-page border border-border-base text-secondary text-[10px] uppercase font-bold tracking-wider rounded-md">
                                                                Głosowanie nr {vote.voting_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-bold group-hover:text-emerald-500 transition-colors line-clamp-2">
                                                        {vote.title}
                                                    </h3>
                                                    {vote.topic && (
                                                        <p className="text-secondary text-sm line-clamp-1">{vote.topic}</p>
                                                    )}
                                                </div>
                                                <ChevronRight className="text-border-base group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Processes Section */}
                        {processes.length > 0 && (!searchParams.get('type') || searchParams.get('type') === 'process') && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <FileText className="text-amber-500" size={24} />
                                    <h2 className="text-2xl font-black tracking-tight">Projekty Ustaw</h2>
                                </div>
                                <div className="grid gap-4">
                                    {processes.map((proc) => (
                                        <Link to={`/ustawy/${proc.id}`} key={proc.id} className="group block bg-surface p-6 rounded-2xl border border-border-base hover:border-amber-500/30 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                                                            {proc.ux_category || 'Projekt'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-secondary font-mono">
                                                            <Calendar size={12} />
                                                            {proc.date}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold group-hover:text-amber-500 transition-colors line-clamp-2">
                                                        {proc.title}
                                                    </h3>
                                                    {proc.topic && (
                                                        <p className="text-secondary text-sm line-clamp-1">{proc.topic}</p>
                                                    )}
                                                </div>
                                                <ChevronRight className="text-border-base group-hover:text-amber-500 transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Speeches Section */}
                        {speeches.length > 0 && (!searchParams.get('type') || searchParams.get('type') === 'speech') && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Mic className="text-purple-500" size={24} />
                                    <h2 className="text-2xl font-black tracking-tight">Wypowiedzi</h2>
                                </div>
                                <div className="grid gap-4">
                                    {speeches.map((speech) => (
                                        <Link to={`/wypowiedzi/${speech.id}`} key={speech.id} className="group block bg-surface p-6 rounded-2xl border border-border-base hover:border-purple-500/30 transition-all">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-purple-500/10 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                                                        Stenogram
                                                    </span>
                                                    <span className="flex items-center gap-1 text-xs text-secondary font-mono">
                                                        <Calendar size={12} />
                                                        {speech.date}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-bold group-hover:text-purple-500 transition-colors">
                                                    {speech.title}
                                                </h3>
                                                <p className="text-secondary text-sm line-clamp-3 italic bg-page/50 p-3 rounded-lg border border-border-base">
                                                    "{speech.content_preview}"
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Interpellations Section */}
                        {interpellations.length > 0 && (!searchParams.get('type') || searchParams.get('type') === 'interpellation') && (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <Search className="text-blue-500" size={24} />
                                    <h2 className="text-2xl font-black tracking-tight">Interpelacje</h2>
                                </div>
                                <div className="grid gap-4">
                                    {interpellations.map((inter) => (
                                        <Link to={`/interpelacje/${inter.id}`} key={inter.id} className="group block bg-surface p-6 rounded-2xl border border-border-base hover:border-blue-500/30 transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                                                            {inter.ux_category || 'Interpelacja'}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-secondary font-mono">
                                                            <Calendar size={12} />
                                                            {inter.date}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-lg font-bold group-hover:text-blue-500 transition-colors line-clamp-2">
                                                        {inter.title}
                                                    </h3>
                                                </div>
                                                <ChevronRight className="text-border-base group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {mps.length === 0 && results.length === 0 && !isLoading && (
                            <div className="text-center py-24 text-secondary">
                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                <h3 className="text-xl font-bold text-primary">Brak wyników</h3>
                                <p>Spróbuj zmienić zapytanie lub filtry</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
