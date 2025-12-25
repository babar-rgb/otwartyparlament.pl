import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, AlignLeft } from 'lucide-react';

interface VoteMindMapProps {
    summary: string;
    pros: string[];
    cons: string[];
    title: string;
}

export default function VoteMindMap({ summary, pros, cons, title }: VoteMindMapProps) {
    return (
        <div className="w-full space-y-8 font-sans">


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Left Column: Summary Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-surface border border-border-base rounded-[2rem] p-6 md:p-10 shadow-sm relative overflow-hidden flex flex-col"
                >
                    <div className="relative z-10 flex flex-col">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest mb-6 border border-indigo-500/20 w-fit">
                            <AlignLeft size={12} />
                            Podsumowanie
                        </div>

                        <h3 className="text-xl md:text-3xl font-black text-primary mb-6 leading-tight">
                            {title}
                        </h3>

                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-secondary text-base md:text-lg leading-relaxed font-medium">
                                {summary}
                            </p>
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
                                <h3 className="text-lg font-black text-primary">Korzyści</h3>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Potencjalne zalety</p>
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
                                <h3 className="text-lg font-black text-primary">Zagrożenia</h3>
                                <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Potencjalne wady</p>
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
                <p className="text-[10px] text-secondary opacity-30 uppercase tracking-widest font-bold">
                    Powered by Gemini Pro • Dane wygenerowane automatycznie
                </p>
            </div>
        </div>
    );
}
