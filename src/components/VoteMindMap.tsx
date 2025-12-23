import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, BrainCircuit, Activity } from 'lucide-react';

interface VoteMindMapProps {
    summary: string;
    pros: string[];
    cons: string[];
    title: string;
}

export default function VoteMindMap({ summary, pros, cons, title }: VoteMindMapProps) {
    // We limit to top 3 arguments to keep the graph clean
    const displayPros = pros.slice(0, 3);
    const displayCons = cons.slice(0, 3);

    return (
        <div className="relative w-full overflow-hidden bg-[#0c0c1a] rounded-3xl p-8 border border-white/5 shadow-2xl">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

            <div className="relative z-10 flex flex-col items-center gap-12 py-8">

                {/* Header */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-500/20">
                        <BrainCircuit size={14} />
                        Mapa Myśli Ustawy
                    </div>
                </div>

                {/* Graph Container */}
                <div className="w-full max-w-5xl relative">

                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/10" style={{ overflow: 'visible' }}>
                        {/* Center to Top (Summary) */}
                        <path d="M50% 160 L50% 80" fill="none" strokeWidth="2" strokeDasharray="4 4" />

                        {/* Center to Left (Pros) */}
                        <path d="M50% 160 C 40% 160, 25% 160, 20% 250" fill="none" strokeWidth="2" className="stroke-emerald-500/30" />

                        {/* Center to Right (Cons) */}
                        <path d="M50% 160 C 60% 160, 75% 160, 80% 250" fill="none" strokeWidth="2" className="stroke-red-500/30" />
                    </svg>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start relative">

                        {/* LEFT COLUMN: PROS */}
                        <div className="space-y-6 lg:mt-32 order-2 lg:order-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-3 justify-center lg:justify-start"
                            >
                                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <ThumbsUp size={20} />
                                </div>
                                <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">Korzyści</h3>
                            </motion.div>

                            <div className="space-y-4">
                                {displayPros.map((pro, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        className="bg-[#0f111a] border border-emerald-500/30 p-4 rounded-xl relative group hover:bg-[#151824] transition-colors"
                                    >
                                        <div className="absolute top-1/2 -right-3 w-3 h-[1px] bg-emerald-500/30 hidden lg:block" />
                                        <p className="text-emerald-100/80 text-sm leading-relaxed">{pro}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* CENTER COLUMN: MAIN TOPIC & SUMMARY */}
                        <div className="flex flex-col items-center gap-8 order-1 lg:order-2">
                            {/* Summary Node */}
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-indigo-950/40 backdrop-blur border border-indigo-500/30 p-6 rounded-2xl text-center max-w-sm"
                            >
                                <p className="text-indigo-200 text-sm italic">{summary}</p>
                            </motion.div>

                            {/* Central Node */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                className="relative w-32 h-32 flex items-center justify-center"
                            >
                                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-20" />
                                <div className="absolute inset-0 border-2 border-blue-500/30 rounded-full" />
                                <div className="w-24 h-24 bg-[#0c0c1a] border-4 border-blue-500/40 rounded-full flex items-center justify-center p-4 relative z-10 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                                    <Activity size={32} className="text-blue-400" />
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-white font-bold text-lg text-center leading-tight max-w-xs"
                            >
                                {title}
                            </motion.h2>
                        </div>

                        {/* RIGHT COLUMN: CONS */}
                        <div className="space-y-6 lg:mt-32 order-3">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center gap-3 justify-center lg:justify-end"
                            >
                                <h3 className="text-red-400 font-bold uppercase tracking-wider text-sm">Zagrożenia</h3>
                                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                                    <ThumbsDown size={20} />
                                </div>
                            </motion.div>

                            <div className="space-y-4">
                                {displayCons.map((con, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        className="bg-[#0f111a] border border-red-500/30 p-4 rounded-xl relative group hover:bg-[#151824] transition-colors text-right"
                                    >
                                        <div className="absolute top-1/2 -left-3 w-3 h-[1px] bg-red-500/30 hidden lg:block" />
                                        <p className="text-red-100/80 text-sm leading-relaxed">{con}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
