import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Stage {
    id: string;
    stage_type: string;
    title: string;
    description: string;
    date: string;
    bill_number?: string;
    vote_id?: number | null;
}

interface LegislativeProcessTimelineProps {
    stages: Stage[];
    currentVoteId?: number | null;
    variant?: 'compact' | 'full';
}

const LegislativeProcessTimeline: React.FC<LegislativeProcessTimelineProps> = ({ stages, currentVoteId, variant = 'compact' }) => {

    // Sort stages by date
    const sortedStages = [...stages].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className={`
            relative ml-2 space-y-8
            ${variant === 'full' ? 'pl-8 border-l-4 border-white/10' : 'pl-4 border-l-2 border-white/10'}
        `}>
            {sortedStages.map((stage, index) => {
                const isCurrent = currentVoteId ? stage.vote_id === currentVoteId : (dateIsRecent(stage.date) && index === sortedStages.length - 1);
                // If no vote ID provided (full view), highlight the LAST stage as current?
                // Or just don't highlight. Let's say if currentVoteId is missing, we highlight the last one as "Latest Status".

                const highlight = isCurrent || (currentVoteId === undefined && index === sortedStages.length - 1);

                const isPast = !highlight && index < sortedStages.length - 1;

                return (
                    <motion.div
                        key={stage.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative ${variant === 'full' ? 'pl-10 pb-4' : 'pl-6'}`}
                    >
                        {/* Dot */}
                        <div className={`absolute top-1 rounded-full border-2 transition-all duration-500
                            ${variant === 'full' ? '-left-[13px] w-6 h-6' : '-left-[9px] w-4 h-4'}
                            ${highlight
                                ? 'bg-blue-500 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110 z-10'
                                : 'bg-[#1A1A1A] border-gray-600'}
                        `}>
                            {highlight && (
                                <span className="absolute inset-0 rounded-full animate-ping bg-blue-500 opacity-75"></span>
                            )}
                        </div>

                        {/* Date */}
                        <div className={`font-mono text-gray-500 mb-1 ${variant === 'full' ? 'text-sm' : 'text-xs'}`}>
                            {stage.date ? format(new Date(stage.date), 'dd MMMM yyyy', { locale: pl }) : 'Data nieznana'}
                        </div>

                        {/* Title */}
                        <h4 className={`font-semibold ${variant === 'full' ? 'text-xl' : 'text-base'} ${highlight ? 'text-white' : isPast ? 'text-gray-500' : 'text-gray-300'}`}>
                            {stage.title}
                        </h4>

                        {/* Description */}
                        <p className={`mt-2 leading-relaxed ${variant === 'full' ? 'text-base opacity-90' : 'text-sm opacity-80'} ${isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                            {stage.description}
                        </p>

                        {/* Badges / Interactions */}
                        <div className="flex gap-2 mt-3">
                            {highlight && (
                                <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
                                    {currentVoteId ? 'TU JESTEŚMY' : 'OSTATNI ETAP'}
                                </div>
                            )}
                            {stage.bill_number && variant === 'full' && (
                                <div className="inline-block px-3 py-1 bg-white/5 text-gray-400 text-xs font-mono rounded-full border border-white/10">
                                    Druk {stage.bill_number}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// Helper
function dateIsRecent(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff < 1000 * 60 * 60 * 24 * 7; // 7 days
}

export default LegislativeProcessTimeline;
