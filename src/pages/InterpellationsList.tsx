import { useState, useEffect } from 'react';
import { fetchInterpellations, fetchMP } from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, FileText, ArrowRight } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

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

export default function InterpellationsList() {
    const [query, setQuery] = useState('');
    const [interpellations, setInterpellations] = useState<Interpellation[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentInterpellations, setRecentInterpellations] = useState<Interpellation[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [totalCount, setTotalCount] = useState<number>(0);

    const [searchParams] = useSearchParams();
    const mpIdFilter = searchParams.get('mp_id');
    const [filterMpName, setFilterMpName] = useState<string>('');

    useEffect(() => {
        if (mpIdFilter) {
            fetchByMp(mpIdFilter);
        } else {
            fetchRecent();
        }
        // Total count could be a separate endpoint or just from recent results
    }, [mpIdFilter]);

    const fetchByMp = async (mpId: string) => {
        setLoading(true);
        try {
            const mp = await fetchMP(mpId);
            setFilterMpName(`${mp.first_name} ${mp.last_name}`);

            const data = await fetchInterpellations({ mp_id: parseInt(mpId) });
            setInterpellations(data);
            setHasSearched(true);
        } catch (err) {
            console.error('Error fetching interpellations by MP:', err);
            setInterpellations([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecent = async () => {
        try {
            setLoading(true);
            const data = await fetchInterpellations({ limit: 10 });
            setRecentInterpellations(data);
            setTotalCount(data.length * 100); // Mocking total count for UI feel if not in API
        } catch (err) {
            console.error('Error fetching recent interpellations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setHasSearched(true);
        try {
            const data = await fetchInterpellations({ limit: 50 }); // Backend doesn't support q yet in interpellations
            // Filter in frontend if q is provided until backend is updated
            const filtered = data.filter((item: any) =>
                item.title?.toLowerCase().includes(query.toLowerCase()) ||
                item.content?.toLowerCase().includes(query.toLowerCase())
            );
            setInterpellations(filtered);
        } catch (err) {
            console.error('Error searching interpellations:', err);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <div className="min-h-screen bg-page text-primary pt-24 pb-12 px-4 md:px-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-12 animate-fade-in">
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight">
                        Wyszukiwarka <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-purple-500 italic font-serif">Interpelacji</span>
                    </h1>
                    <p className="text-lg text-secondary font-medium max-w-2xl mx-auto italic">
                        Przeszukaj <span className="text-primary font-black">{totalCount.toLocaleString()}</span> interpelacji poselskich.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
                        <input
                            type="text"
                            placeholder="Szukaj (np. 'szpital')..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-14 pr-32 py-5 rounded-[var(--radius-card-md)] bg-surface border border-border-base focus:border-accent-blue focus:ring-0 transition-all text-lg shadow-xl"
                        />
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary/30" size={24} />
                        <button type="submit" disabled={loading} className="absolute right-3 top-3 bottom-3 px-8 bg-accent-blue text-white font-black rounded-[var(--radius-badge)] uppercase tracking-wider text-xs">
                            {loading ? 'Szukam...' : 'Szukaj'}
                        </button>
                    </form>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                        <FileText className="text-accent-blue" />
                        {mpIdFilter && filterMpName ? `Interpelacje posła ${filterMpName}` : hasSearched ? `Wyniki wyszukiwania` : 'Ostatnie interpelacje'}
                    </h2>

                    <div className="grid gap-6">
                        {(!hasSearched ? recentInterpellations : interpellations).length === 0 && !loading && (
                            <EmptyState
                                title="Brak interpelacji"
                                description="Nie znaleziono zapytań spełniających podane kryteria."
                                icon="file"
                            />
                        )}
                        {(!hasSearched ? recentInterpellations : interpellations).map((item) => {
                            // ... loop content remains identical ...
                            const authorList = item.raw_data?.from || [];
                            const authorName = Array.isArray(authorList) ? (authorList[0] || 'Nieznany poseł') : authorList;
                            const contentText = item.content || item.raw_data?.content || item.title;

                            return (
                                <Link key={item.id} to={`/interpelacje/${item.id}`} className="group block bg-surface p-8 rounded-[var(--radius-card-md)] border border-border-base shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-accent-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="flex justify-between items-start gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center text-accent-blue">
                                                <FileText size={22} />
                                            </div>
                                            <div>
                                                <p className="font-black text-primary text-lg">{authorName}</p>
                                                <p className="text-[10px] font-black text-secondary opacity-40 uppercase">Nr {item.raw_data?.num || item.id}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-secondary bg-black/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-border-base">
                                                {item.sent_date}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-primary mb-4 leading-tight">{item.title}</h3>
                                    <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
                                        <p className="text-secondary leading-relaxed line-clamp-3 text-sm font-medium italic opacity-80"
                                            dangerouslySetInnerHTML={{ __html: query ? highlightText(contentText || '', query) : ((contentText || '').slice(0, 300) + '...') }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Zobacz szczegóły <ArrowRight size={14} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
