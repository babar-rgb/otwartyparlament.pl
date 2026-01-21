import React, { useState } from 'react';
import { Network, Loader2, X } from 'lucide-react';
import { fetchVoteConnections } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectionFlow from './ConnectionFlow';

interface VoteConnectionsProps {
    voteId: number | string;
    voteTitle?: string;
    className?: string;
    variant?: 'button' | 'card';
}

const VoteConnections: React.FC<VoteConnectionsProps> = ({ voteId, voteTitle = "Głosowanie", className, variant = 'button' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<{
        process: any;
        bills: any[];
        committees: any[];
    } | null>(null);

    const toggleOpen = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isOpen && !data) {
            setLoading(true);
            try {
                const res = await fetchVoteConnections(voteId);
                setData(res);
            } catch (err) {
                console.error("Failed to fetch connections", err);
            } finally {
                setLoading(false);
            }
        }
        setIsOpen(!isOpen);
    };

    if (variant === 'card') {
        return (
            <div className={`relative ${className}`}>
                <div
                    onClick={toggleOpen}
                    className="bg-surface p-6 rounded-2xl border border-border-base hover:border-accent-blue/30 transition-all group cursor-pointer shadow-sm relative overflow-hidden h-full"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Network size={64} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-accent-blue/10 text-accent-blue rounded-xl group-hover:scale-110 transition-transform">
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Network size={20} />}
                        </div>
                        <div>
                            <div className="font-bold text-primary">Powiązania</div>
                            <div className="text-xs text-secondary">Druki, procesy i komisje</div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10">
                            {/* Animated Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/80 backdrop-blur-md"
                            />

                            {/* Modal Window */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-6xl h-full max-h-[85vh] bg-surface border border-border-base rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col z-10"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between p-6 md:p-8 border-b border-border-base bg-surface">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent-blue/10 text-accent-blue rounded-xl">
                                            <Network size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-secondary leading-none mb-1">Powiązania Legislacyjne</h4>
                                            <p className="text-[10px] text-secondary/60 font-bold uppercase tracking-widest">{voteTitle}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-3 hover:bg-page rounded-full transition-colors group"
                                    >
                                        <X size={24} className="text-secondary group-hover:text-primary" />
                                    </button>
                                </div>

                                {/* Flow Content */}
                                <div className="flex-grow relative bg-page/50">
                                    {loading ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                            <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
                                            <span className="text-xs font-black text-secondary uppercase tracking-widest">Generowanie sieci powiązań...</span>
                                        </div>
                                    ) : data?.process ? (
                                        <ConnectionFlow voteTitle={voteTitle} data={data} />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <p className="text-xs text-secondary font-black uppercase tracking-widest">Brak danych o powiązaniach</p>
                                        </div>
                                    )}
                                </div>

                                {/* Footer / Hint */}
                                <div className="p-4 border-t border-border-base bg-surface/50 text-center">
                                    <p className="text-[9px] font-black text-secondary/40 uppercase tracking-[0.3em]">
                                        Interaktywny Mapa Myśli • Klikaj w węzły aby sprawdzić szczegóły
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={toggleOpen}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-accent-blue/20 shadow-sm"
            >
                <Network size={12} className={isOpen ? "rotate-90 transition-transform" : "transition-transform"} />
                Powiązania
            </button>

        </div>
    );
};

export default VoteConnections;
