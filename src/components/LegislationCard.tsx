import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileText, Users, ExternalLink, Sparkles } from 'lucide-react';

interface LegislationCardProps {
    id: string;
    title: string;
    date: string;
    uxCategory?: string;
    tldr?: {
        what_changes?: string;
        who_affected?: string[];
        pros?: string[];
        cons?: string[];
    };
    description?: string;
}

export default function LegislationCard({
    id,
    title,
    date,
    uxCategory,
    tldr,
    description
}: LegislationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getShortSummary = () => {
        if (tldr?.what_changes) {
            return tldr.what_changes.length > 150
                ? tldr.what_changes.substring(0, 150) + '...'
                : tldr.what_changes;
        }
        if (description) {
            return description.length > 150
                ? description.substring(0, 150) + '...'
                : description;
        }
        return 'Kliknij aby zobaczyć szczegóły';
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Layer 1: Minimal View (Always Visible) */}
            <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                        {uxCategory && (
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold">
                                {uxCategory}
                            </span>
                        )}
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(date).toLocaleDateString('pl-PL')}
                        </span>
                    </div>
                    {tldr && (
                        <span className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                            <Sparkles className="w-3 h-3" />
                            AI
                        </span>
                    )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 line-clamp-2">
                    {title}
                </h3>

                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    {getShortSummary()}
                </p>

                {/* Expand/Collapse Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            Zwiń
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Rozwiń szczegóły
                        </>
                    )}
                </button>
            </div>

            {/* Layer 2: Expanded Details */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-0 border-t border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                    <div className="pt-4 space-y-4">
                        {/* Who is affected */}
                        {tldr?.who_affected && tldr.who_affected.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Kogo dotyczy?</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tldr.who_affected.map((group, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-sm text-slate-700 dark:text-slate-300">
                                            {group}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pros & Cons */}
                        {(tldr?.pros?.length || tldr?.cons?.length) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {tldr?.pros && tldr.pros.length > 0 && (
                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                        <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">👍 Plusy</div>
                                        <ul className="space-y-1">
                                            {tldr.pros.map((pro, i) => (
                                                <li key={i} className="text-sm text-emerald-800 dark:text-emerald-300">• {pro}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {tldr?.cons && tldr.cons.length > 0 && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                        <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">👎 Minusy</div>
                                        <ul className="space-y-1">
                                            {tldr.cons.map((con, i) => (
                                                <li key={i} className="text-sm text-red-800 dark:text-red-300">• {con}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Layer 3: Full Details Link */}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                            <Link
                                to={`/projekty/${id}`}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                            >
                                <FileText className="w-4 h-4" />
                                Pełne szczegóły
                            </Link>
                            <a
                                href={`https://sejm.gov.pl/sejm10/processes/${id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Sejm.gov.pl
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
