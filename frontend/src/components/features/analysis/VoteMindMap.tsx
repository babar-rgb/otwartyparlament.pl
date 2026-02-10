import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, AlignLeft, ChevronRight, X, Maximize2 } from 'lucide-react';

interface VoteMindMapProps {
    summary: string;
    summary_expert?: string;
    pros: string[];
    cons: string[];
    title: string;
    voteId: number;
    procedural_context?: string; // Phase 3 AI Narrator
}

import LegislativeMetro from './LegislativeMetro';

export default function VoteMindMap({ summary, summary_expert, pros, cons, title, voteId, procedural_context }: VoteMindMapProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Phase 3: Parse Procedural Context
    let contextData = null;
    try {
        if (procedural_context) {
            contextData = JSON.parse(procedural_context);
        }
    } catch (e) {
        console.error("Failed to parse procedural context", e);
    }

    // Determine if text is long enough to need truncation
    const shouldTruncate = summary.length > 250;

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isModalOpen]);

    return (
        <div className="w-full space-y-8 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Summary Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface border border-border-base rounded-[2rem] p-6 md:p-10 shadow-sm relative overflow-hidden flex flex-col h-full"
                >
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest mb-6 border border-indigo-500/20 w-fit">
                            <AlignLeft size={12} />
                            Podsumowanie
                        </div>

                        <h3 className="text-xl md:text-3xl font-black text-primary mb-6 leading-tight">
                            {title}
                        </h3>

                        {/* Phase 3: Procedural Context Card */}
                        {contextData && (
                            <div className="mb-8 p-5 bg-[#1A1A1A]/80 border-l-4 border-indigo-500 rounded-r-xl shadow-lg backdrop-blur-sm">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    Kontekst Proceduralny
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 font-mono mb-1">CO SIĘ DZIEJE:</p>
                                        <p className="text-sm text-gray-200 font-medium leading-relaxed">
                                            {contextData.procedural_context}
                                        </p>
                                    </div>
                                    {contextData.legal_consequence && (
                                        <div>
                                            <p className="text-xs text-gray-500 font-mono mb-1">SKUTKI PRAWNE:</p>
                                            <p className="text-sm text-white/90 font-medium leading-relaxed">
                                                {contextData.legal_consequence}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <LegislativeMetro voteId={voteId} />

                        <div className="prose dark:prose-invert max-w-none flex-grow relative">
                            <p className={`text-secondary text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap ${shouldTruncate ? 'line-clamp-6' : ''}`}>
                                {summary}
                            </p>

                            {/* Gradient overlay for preview */}
                            {shouldTruncate && (
                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-surface via-surface/80 to-transparent pointer-events-none" />
                            )}

                            {shouldTruncate && (
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-6 flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all font-bold text-sm uppercase tracking-wider group w-fit"
                                >
                                    <Maximize2 size={16} />
                                    {summary_expert ? 'Czytaj pełną analizę ekspertów' : 'Czytaj pełną analizę'}
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>


                {/* Right Column: Pros and Cons Stacked */}
                <div className="flex flex-col gap-6">
                    {/* Pros Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-surface border border-border-base rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col hover:border-emerald-500/20 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <ThumbsUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-primary">Argumenty ZA</h3>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Potencjalne korzyści</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-grow">
                            {pros.slice(0, 3).map((pro, i) => (
                                <div key={i} className="p-4 rounded-xl bg-border-base/50 border border-border-base flex gap-3 items-start group/item hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                                    </div>
                                    <p className="text-secondary text-sm leading-relaxed font-semibold">
                                        {pro}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Cons Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-surface border border-border-base rounded-[2rem] p-6 md:p-8 shadow-sm flex flex-col hover:border-rose-500/20 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <ThumbsDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-primary">Argumenty PRZECIW</h3>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Ryzyka i wady</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-grow">
                            {cons.slice(0, 3).map((con, i) => (
                                <div key={i} className="p-4 rounded-xl bg-border-base/50 border border-border-base flex gap-3 items-start group/item hover:bg-rose-500/10 hover:border-rose-500/20 transition-all">
                                    <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{i + 1}</span>
                                    </div>
                                    <p className="text-secondary text-sm leading-relaxed font-semibold">
                                        {con}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="text-center pt-4">
                <p className="text-[10px] text-secondary opacity-30 uppercase tracking-widest font-black">
                    Analiza AI (Gemini Pro) • Dane wygenerowane automatycznie
                </p>
            </div>

            {/* Reading Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                        >
                            <div className="bg-surface border border-border-base w-full max-w-3xl max-h-[85vh] rounded-[2rem] shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
                                {/* Header */}
                                <div className="p-6 md:p-8 border-b border-border-base flex items-start justify-between gap-4 bg-surface sticky top-0 z-10">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest mb-3 border border-indigo-500/20">
                                            <AlignLeft size={12} />
                                            Pełna Analiza
                                        </div>
                                        <h3 className="text-xl md:text-2xl font-black text-primary leading-tight">
                                            {title}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-secondary transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="overflow-y-auto p-6 md:p-10">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-primary text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                                            {summary_expert || summary}
                                        </p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-4 md:p-6 border-t border-border-base bg-black/5 dark:bg-white/5 flex justify-end">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm tracking-wide hover:opacity-90 transition-opacity"
                                    >
                                        Zamknij
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
