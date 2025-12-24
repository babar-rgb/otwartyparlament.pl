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


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Left Column: Summary Card (Full Height) */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden flex flex-col h-full"
                >
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black uppercase tracking-widest mb-6 border border-indigo-500/20 w-fit">
                            <AlignLeft size={12} />
                            Podsumowanie
                        </div>

                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                            {title}
                        </h3>

                        <div className="prose dark:prose-invert max-w-none flex-grow">
                            <p className="text-slate-600 dark:text-white/70 text-lg leading-relaxed font-medium">
                                {summary}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Pros and Cons Stacked */}
                <div className="flex flex-col gap-6 h-full">
                    {/* Pros Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm flex flex-col flex-1 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <ThumbsUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Korzyści</h3>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-wider">Potencjalne zalety</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-grow">
                            {pros.slice(0, 3).map((pro, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex gap-3 items-start group/item hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-100 dark:hover:border-emerald-500/20 transition-all">
                                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-white/80 text-sm leading-relaxed font-medium">
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
                        className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm flex flex-col flex-1 hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                <ThumbsDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Zagrożenia</h3>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 font-bold uppercase tracking-wider">Potencjalne wady</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-grow">
                            {cons.slice(0, 3).map((con, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex gap-3 items-start group/item hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:border-rose-100 dark:hover:border-rose-500/20 transition-all">
                                    <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{i + 1}</span>
                                    </div>
                                    <p className="text-slate-600 dark:text-white/80 text-sm leading-relaxed font-medium">
                                        {con}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="text-center">
                <p className="text-[10px] text-slate-400 dark:text-white/20 uppercase tracking-widest font-bold">
                    Powered by Gemini Pro • Dane wygenerowane automatycznie
                </p>
            </div>
        </div>
    );
}
