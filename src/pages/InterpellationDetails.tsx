import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, Calendar, User, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';

interface Interpellation {
    id: number;
    title: string;
    sent_date: string;
    content: string;
    reply_content: string | null;
    receipt_date: string | null;
    addressee: string | null;
    topic: string | null;
}

interface Author {
    mp_id: number;
    mps: {
        id: number;
        name: string;
        party: string;
        photo_url: string;
        slug: string;
    };
}

export default function InterpellationDetails() {
    const { id } = useParams();
    const [interpellation, setInterpellation] = useState<Interpellation | null>(null);
    const [authors, setAuthors] = useState<Author[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFullContent, setShowFullContent] = useState(false);
    const [showFullReply, setShowFullReply] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;

            try {
                // Fetch interpellation
                const { data: interpData, error: interpError } = await supabase
                    .from('interpellations')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (interpError) throw interpError;
                setInterpellation(interpData);

                // Fetch authors
                const { data: authorsData, error: authorsError } = await supabase
                    .from('interpellation_authors')
                    .select('mp_id, mps(id, name, party, photo_url, slug)')
                    .eq('interpellation_id', id);

                if (!authorsError && authorsData) {
                    setAuthors(authorsData as unknown as Author[]);
                }
            } catch (error) {
                console.error('Error loading interpellation:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <div className="animate-pulse">Ładowanie interpelacji...</div>
            </div>
        );
    }

    if (!interpellation) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Interpelacja nie znaleziona</h1>
                <Link to="/interpelacje" className="text-blue-600 hover:underline">
                    Wróć do listy interpelacji
                </Link>
            </div>
        );
    }

    const contentPreview = interpellation.content?.slice(0, 500);
    const replyPreview = interpellation.reply_content?.slice(0, 500);
    const hasMoreContent = interpellation.content && interpellation.content.length > 500;
    const hasMoreReply = interpellation.reply_content && interpellation.reply_content.length > 500;

    return (
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
            <SEO
                title={`Interpelacja nr ${interpellation.id}`}
                description={interpellation.title}
            />

            {/* Back button */}
            <Link
                to="/interpelacje"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
            >
                <ArrowLeft size={18} />
                Wróć do listy interpelacji
            </Link>

            {/* Header */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <Mail size={28} className="text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <span className="text-sm text-blue-600 font-semibold">
                            Interpelacja nr {interpellation.id}
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1">
                            {interpellation.title}
                        </h1>
                    </div>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-4">
                    <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Złożono: {interpellation.sent_date}</span>
                    </div>
                    {interpellation.receipt_date && (
                        <div className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            <span>Odpowiedź: {interpellation.receipt_date}</span>
                        </div>
                    )}
                    {interpellation.addressee && (
                        <div className="flex items-center gap-1">
                            <User size={14} />
                            <span>Do: {interpellation.addressee}</span>
                        </div>
                    )}
                </div>

                {/* Link to original */}
                <a
                    href={`https://sejm.gov.pl/Sejm10.nsf/interpelacja.xsp?typ=INT&nr=${interpellation.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 mt-4"
                >
                    <ExternalLink size={14} />
                    Zobacz oryginał na sejm.gov.pl
                </a>
            </div>

            {/* Authors */}
            {authors.length > 0 && (
                <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        {authors.length === 1 ? 'Autor interpelacji' : 'Autorzy interpelacji'}
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        {authors.map((author) => (
                            <Link
                                key={author.mp_id}
                                to={`/poslowie/${author.mps.slug || author.mps.id}`}
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-colors group"
                            >
                                <img
                                    src={author.mps.photo_url}
                                    alt={author.mps.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = 'https://via.placeholder.com/48';
                                    }}
                                />
                                <div>
                                    <div className="font-semibold text-slate-900 group-hover:text-blue-600">
                                        {author.mps.name}
                                    </div>
                                    <div className="text-xs text-slate-500">{author.mps.party}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Interpellation Content */}
            <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm mb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-blue-600" />
                    Treść interpelacji
                </h2>

                {interpellation.content ? (
                    <div className="prose prose-slate max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {showFullContent ? interpellation.content : contentPreview}
                            {!showFullContent && hasMoreContent && '...'}
                        </div>
                        {hasMoreContent && (
                            <button
                                onClick={() => setShowFullContent(!showFullContent)}
                                className="mt-4 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                            >
                                {showFullContent ? 'Zwiń treść' : 'Pokaż pełną treść'}
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-500 italic">
                        Treść interpelacji nie jest jeszcze dostępna. Trwa pobieranie danych.
                    </p>
                )}
            </div>

            {/* Reply Content */}
            {interpellation.reply_content && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-8 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageSquare size={20} className="text-green-600" />
                        Odpowiedź na interpelację
                    </h2>

                    <div className="prose prose-slate max-w-none">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {showFullReply ? interpellation.reply_content : replyPreview}
                            {!showFullReply && hasMoreReply && '...'}
                        </div>
                        {hasMoreReply && (
                            <button
                                onClick={() => setShowFullReply(!showFullReply)}
                                className="mt-4 text-green-600 hover:text-green-800 font-semibold text-sm"
                            >
                                {showFullReply ? 'Zwiń odpowiedź' : 'Pokaż pełną odpowiedź'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* No reply yet */}
            {!interpellation.reply_content && (
                <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-6 text-center">
                    <MessageSquare size={32} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-800 font-medium">
                        Brak odpowiedzi na interpelację
                    </p>
                    <p className="text-sm text-amber-600 mt-1">
                        Odpowiedź nie została jeszcze udzielona lub nie jest dostępna w systemie.
                    </p>
                </div>
            )}
        </div>
    );
}
