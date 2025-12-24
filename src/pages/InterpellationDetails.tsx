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
            <div className="min-h-screen bg-[#060613] flex items-center justify-center">
                <div className="text-white/40 text-sm font-medium tracking-wider uppercase">Ładowanie interpelacji...</div>
            </div>
        );
    }

    if (!interpellation) {
        return (
            <div className="min-h-screen bg-[#060613] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Interpelacja nie znaleziona</h1>
                    <Link to="/interpelacje" className="text-blue-400 hover:text-blue-300">
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
        <div className="min-h-screen bg-[#060613] pt-24 pb-16 px-4 md:px-8">
            <SEO
                title={`Interpelacja nr ${interpellation.id}`}
                description={interpellation.title}
            />

            <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <Link
                    to="/interpelacje"
                    className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={16} />
                    Wróć do listy interpelacji
                </Link>

                {/* Header */}
                <div className="bg-[#111126] rounded-3xl border border-white/5 p-6 md:p-8 mb-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Mail size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <span className="text-sm text-blue-400 font-semibold">
                                Interpelacja nr {interpellation.id}
                            </span>
                            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
                                {interpellation.title}
                            </h1>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 text-sm text-white/50 mt-4">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
                            <Calendar size={14} />
                            <span>Złożono: {interpellation.sent_date}</span>
                        </div>
                        {interpellation.addressee && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5">
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
                        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-blue-400 mt-4 transition-colors"
                    >
                        <ExternalLink size={14} />
                        Zobacz oryginał na sejm.gov.pl
                    </a>
                </div>

                {/* Authors */}
                {authors.length > 0 && (
                    <div className="bg-[#111126] rounded-2xl border border-white/5 p-5 mb-6">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <User size={16} className="text-purple-400" />
                            {authors.length === 1 ? 'Autor interpelacji' : 'Autorzy interpelacji'}
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {authors.map((author) => (
                                <Link
                                    key={author.mp_id}
                                    to={`/poslowie/${author.mps.slug || author.mps.id}`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                                >
                                    <img
                                        src={author.mps.photo_url}
                                        alt={author.mps.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/40';
                                        }}
                                    />
                                    <div>
                                        <div className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                                            {author.mps.name}
                                        </div>
                                        <div className="text-xs text-white/40">{author.mps.party}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Interpellation Content */}
                <div className="bg-[#111126] rounded-2xl border border-white/5 p-6 md:p-8 mb-6">
                    <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-blue-400" />
                        Treść interpelacji
                    </h2>

                    {interpellation.content ? (
                        <div>
                            <div className="whitespace-pre-wrap text-white/70 leading-relaxed text-sm">
                                {showFullContent ? interpellation.content : contentPreview}
                                {!showFullContent && hasMoreContent && '...'}
                            </div>
                            {hasMoreContent && (
                                <button
                                    onClick={() => setShowFullContent(!showFullContent)}
                                    className="mt-4 text-blue-400 hover:text-blue-300 font-semibold text-sm transition-colors"
                                >
                                    {showFullContent ? '↑ Zwiń treść' : '↓ Pokaż pełną treść'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-white/40 italic text-sm">
                            Treść niedostępna z powodu błędu po stronie API Sejmu (błąd zewnętrzny). Prosimy spróbować otworzyć oryginał.
                        </p>
                    )}
                </div>

                {/* Reply Content */}
                {interpellation.reply_content && (
                    <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-6 md:p-8 mb-6">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <MessageSquare size={16} className="text-emerald-400" />
                            Odpowiedź na interpelację
                        </h2>

                        <div>
                            <div className="whitespace-pre-wrap text-white/70 leading-relaxed text-sm">
                                {showFullReply ? interpellation.reply_content : replyPreview}
                                {!showFullReply && hasMoreReply && '...'}
                            </div>
                            {hasMoreReply && (
                                <button
                                    onClick={() => setShowFullReply(!showFullReply)}
                                    className="mt-4 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-colors"
                                >
                                    {showFullReply ? '↑ Zwiń odpowiedź' : '↓ Pokaż pełną odpowiedź'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* No reply yet */}
                {!interpellation.reply_content && (
                    <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-6 text-center">
                        <MessageSquare size={28} className="text-amber-400 mx-auto mb-2" />
                        <p className="text-amber-300 font-medium text-sm">
                            Brak odpowiedzi na interpelację
                        </p>
                        <p className="text-xs text-amber-400/60 mt-1">
                            Odpowiedź nie została jeszcze udzielona lub nie jest dostępna w systemie.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
