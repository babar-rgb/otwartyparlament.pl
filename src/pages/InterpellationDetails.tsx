import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Mail, Calendar, User, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import SEO from '../components/SEO';
import { useInterpellationDetails } from '../hooks/useInterpellationDetails';

export default function InterpellationDetails() {
    const { id } = useParams();
    const { interpellation, authors, loading } = useInterpellationDetails(id);
    const [showFullContent, setShowFullContent] = useState(false);
    const [showFullReply, setShowFullReply] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-secondary text-sm font-black tracking-[0.3em] uppercase animate-pulse">Neural Link Establishing...</div>
            </div>
        );
    }

    if (!interpellation) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center">
                <div className="text-center p-8 bg-surface rounded-3xl border border-border-base shadow-xl">
                    <h1 className="text-2xl font-black text-primary mb-4 italic">Interpelacja nie znaleziona</h1>
                    <Link to="/interpelacje" className="text-accent-blue hover:text-accent-blue/80 font-black uppercase tracking-widest text-xs">
                        Wróć do listy interpelacji
                    </Link>
                </div>
            </div>
        );
    }

    const contentPreview = interpellation.content?.slice(0, 800);
    const replyPreview = interpellation.reply_content?.slice(0, 800);
    const hasMoreContent = interpellation.content && interpellation.content.length > 800;
    const hasMoreReply = interpellation.reply_content && interpellation.reply_content.length > 800;

    return (
        <div className="min-h-screen bg-page pt-24 pb-16 px-4 md:px-8 transition-all duration-500">
            <SEO
                title={`Interpelacja nr ${interpellation.id}`}
                description={interpellation.title}
            />

            <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <Link
                    to="/interpelacje"
                    className="inline-flex items-center gap-2 text-secondary hover:text-accent-blue mb-8 text-xs font-black uppercase tracking-widest transition-all hover:-translate-x-1"
                >
                    <ArrowLeft size={16} />
                    Wróć do listy interpelacji
                </Link>

                {/* Header */}
                <div className="bg-surface rounded-3xl border border-border-base p-8 md:p-12 mb-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-blue/10 transition-all duration-700" />
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Mail size={32} className="text-accent-blue" />
                        </div>
                        <div className="text-center md:text-left">
                            <span className="text-[10px] font-black text-accent-blue uppercase tracking-[0.2em] bg-accent-blue/5 px-3 py-1 rounded-full border border-accent-blue/10">
                                Interpelacja nr {interpellation.id}
                            </span>
                            <h1 className="text-2xl md:text-4xl font-black text-primary mt-4 leading-tight italic font-serif">
                                {interpellation.title}
                            </h1>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-8">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-border-base text-xs font-black text-secondary uppercase tracking-widest">
                            <Calendar size={14} className="text-accent-blue" />
                            <span>Złożono: {interpellation.sent_date}</span>
                        </div>
                        {interpellation.addressee && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-border-base text-xs font-black text-secondary uppercase tracking-widest">
                                <User size={14} className="text-purple-500" />
                                <span>Do: {interpellation.addressee}</span>
                            </div>
                        )}
                    </div>

                    {/* Link to original */}
                    <a
                        href={`https://sejm.gov.pl/Sejm10.nsf/interpelacja.xsp?typ=INT&nr=${interpellation.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-secondary opacity-40 hover:opacity-100 hover:text-accent-blue mt-8 transition-all uppercase tracking-widest bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl group/link"
                    >
                        <ExternalLink size={14} className="group-hover/link:rotate-12 transition-transform" />
                        Zobacz oryginał na sejm.gov.pl
                    </a>
                </div>

                {/* Authors */}
                {authors.length > 0 && (
                    <div className="bg-surface rounded-3xl border border-border-base p-8 mb-8 shadow-sm">
                        <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                            <User size={18} className="text-purple-500" />
                            {authors.length === 1 ? 'Autor interpelacji' : 'Autorzy interpelacji'}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {authors.map((author) => (
                                <Link
                                    key={author.mp_id}
                                    to={`/poslowie/${author.mps.slug || author.mps.id}`}
                                    className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-border-base hover:border-accent-blue/30 transition-all group shadow-sm"
                                >
                                    <img
                                        src={author.mps.photo_url}
                                        alt={author.mps.name}
                                        className="w-12 h-12 rounded-full object-cover border border-border-base group-hover:border-accent-blue transition-colors"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/40';
                                        }}
                                    />
                                    <div>
                                        <div className="font-black text-primary text-base group-hover:text-accent-blue transition-colors">
                                            {author.mps.name}
                                        </div>
                                        <div className="text-[10px] font-black text-secondary uppercase tracking-widest opacity-40">{author.mps.party}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Interpellation Content */}
                <div className="bg-surface rounded-3xl border border-border-base p-8 md:p-12 mb-8 shadow-sm">
                    <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-8 flex items-center gap-3 border-b border-border-base pb-4">
                        <FileText size={18} className="text-accent-blue" />
                        Treść interpelacji
                    </h2>

                    {interpellation.content ? (
                        <div>
                            <div className="whitespace-pre-wrap text-secondary leading-relaxed text-base italic font-medium opacity-90">
                                {showFullContent ? interpellation.content : contentPreview}
                                {!showFullContent && hasMoreContent && '...'}
                            </div>
                            {hasMoreContent && (
                                <button
                                    onClick={() => setShowFullContent(!showFullContent)}
                                    className="mt-8 text-accent-blue hover:text-accent-blue/80 font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 transition-all hover:gap-3"
                                >
                                    {showFullContent ? '↑ Zwiń treść' : '↓ Pokaż pełną treść'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-secondary/40 italic text-sm text-center py-8">
                            Treść niedostępna z powodu błędu po stronie API Sejmu (błąd zewnętrzny). Prosimy spróbować otworzyć oryginał.
                        </p>
                    )}
                </div>

                {/* Reply Content */}
                {interpellation.reply_content && (
                    <div className="bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/20 p-8 md:p-12 mb-8 shadow-lg shadow-emerald-500/5">
                        <h2 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3 border-b border-emerald-500/10 pb-4">
                            <MessageSquare size={18} className="text-emerald-500" />
                            Odpowiedź na interpelację
                        </h2>

                        <div>
                            <div className="whitespace-pre-wrap text-secondary leading-relaxed text-base italic font-medium opacity-90">
                                {showFullReply ? interpellation.reply_content : replyPreview}
                                {!showFullReply && hasMoreReply && '...'}
                            </div>
                            {hasMoreReply && (
                                <button
                                    onClick={() => setShowFullReply(!showFullReply)}
                                    className="mt-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-black uppercase tracking-[0.2em] text-xs flex items-center gap-2 transition-all hover:gap-3"
                                >
                                    {showFullReply ? '↑ Zwiń odpowiedź' : '↓ Pokaż pełną odpowiedź'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* No reply yet */}
                {!interpellation.reply_content && (
                    <div className="bg-amber-500/5 rounded-3xl border border-amber-500/20 p-12 text-center shadow-lg shadow-amber-500/5">
                        <MessageSquare size={40} className="text-amber-500 mx-auto mb-4 opacity-50" />
                        <p className="text-amber-600 dark:text-amber-400 font-black uppercase tracking-[0.2em] text-sm">
                            Brak odpowiedzi na interpelację
                        </p>
                        <p className="text-xs text-secondary opacity-40 mt-2 font-medium">
                            Odpowiedź nie została jeszcze udzielona lub nie jest dostępna w systemie.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
