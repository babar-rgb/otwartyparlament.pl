import { Zap, BookOpen, ThumbsUp, ThumbsDown, Users } from 'lucide-react';

interface TLDRData {
    tldr: string;
    what_changes: string;
    who_affected: string[];
    pros: string[];
    cons: string[];
}

interface ProcessTLDRProps {
    data: TLDRData;
}

export default function ProcessTLDR({ data }: ProcessTLDRProps) {
    if (!data) return null;

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 md:p-8 shadow-sm mb-10 text-ink">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Zap size={24} fill="currentColor" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-amber-900">Szybkie Podsumowanie (TL;DR)</h2>
                    <p className="text-sm text-amber-700">Wygenerowane przez AI</p>
                </div>
            </div>

            {/* Main Content Info */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <BookOpen size={18} /> Co się zmienia?
                    </h3>
                    <p className="text-amber-800 leading-relaxed border-l-4 border-amber-300 pl-4 py-1">
                        {data.what_changes || "Brak szczegółowych danych."}
                    </p>
                </div>
                <div>
                    <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <Users size={18} /> Kogo to dotyczy?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.who_affected && data.who_affected.length > 0 ? (
                            data.who_affected.map((group, i) => (
                                <span key={i} className="px-3 py-1 bg-white border border-amber-200 rounded-full text-sm font-medium text-amber-800 shadow-sm">
                                    {group}
                                </span>
                            ))
                        ) : (
                            <span className="text-amber-700 italic">Wszyscy obywatele</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/60 rounded-xl p-5 border border-amber-100">
                    <h3 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                        <ThumbsUp size={16} /> Potencjalne Plusy
                    </h3>
                    <ul className="space-y-2">
                        {data.pros && data.pros.map((pro, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                                <span className="text-emerald-500 font-bold">•</span>
                                {pro}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="bg-white/60 rounded-xl p-5 border border-amber-100">
                    <h3 className="font-bold text-rose-700 mb-3 flex items-center gap-2">
                        <ThumbsDown size={16} /> Potencjalne Ryzyka
                    </h3>
                    <ul className="space-y-2">
                        {data.cons && data.cons.map((con, i) => (
                            <li key={i} className="flex gap-2 text-sm text-slate-700">
                                <span className="text-rose-500 font-bold">•</span>
                                {con}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
