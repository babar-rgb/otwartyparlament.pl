import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
    FileText,
    MessageSquare,
    ArrowRightCircle,
    CheckCircle2,
    XCircle,
    ShieldCheck,
    Scale,
    Gavel,
    History
} from 'lucide-react';

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

const getStageIcon = (type: string) => {
    switch (type.toUpperCase()) {
        case 'SUBMISSION': return <FileText size={18} />;
        case 'READING_1':
        case 'READING_2':
        case 'READING_3': return <MessageSquare size={18} />;
        case 'SENATE': return <ArrowRightCircle size={18} />;
        case 'VOTE': return <Gavel size={18} />;
        case 'SIGNATURE': return <ShieldCheck size={18} />;
        case 'BILLS_AMENDED': return <Scale size={18} />;
        case 'REJECTED': return <XCircle size={18} />;
        case 'SIGNED': return <CheckCircle2 size={18} />;
        default: return <History size={18} />;
    }
};

const getStageColor = (type: string, highlight: boolean) => {
    if (!highlight) return 'text-secondary bg-white/5 border-white/10';

    switch (type.toUpperCase()) {
        case 'SIGNATURE':
        case 'SIGNED': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
        case 'REJECTED':
        case 'VETO': return 'text-rose-400 bg-rose-500/20 border-rose-500/30';
        case 'VOTE': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
        default: return 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30';
    }
};

const LegislativeProcessTimeline: React.FC<LegislativeProcessTimelineProps> = ({ stages, currentVoteId, variant = 'compact' }) => {
    const sortedStages = [...stages].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className={`relative ${variant === 'full' ? 'pl-8' : 'pl-4'}`}>
            {/* Main Metro Line */}
            <div className={`absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-emerald-500/50 rounded-full ${variant === 'full' ? 'ml-[1.125rem]' : 'ml-[0.625rem]'}`} />

            <div className="space-y-12">
                {sortedStages.map((stage, index) => {
                    const isCurrent = currentVoteId ? stage.vote_id === currentVoteId : (dateIsRecent(stage.date) && index === sortedStages.length - 1);
                    const highlight = isCurrent || (currentVoteId === undefined && index === sortedStages.length - 1);
                    const isPast = index < sortedStages.length - 1;
                    const stageColorClass = getStageColor(stage.stage_type, highlight);

                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="relative pl-12"
                        >
                            {/* Terminal / Station Dot */}
                            <div className={`
                                absolute left-0 top-1 p-1.5 rounded-xl border-2 z-10 
                                transition-all duration-700 flex items-center justify-center
                                ${variant === 'full' ? 'w-10 h-10 -left-1' : 'w-8 h-8 -left-0.5'}
                                ${highlight ? 'bg-surface shadow-[0_0_30px_rgba(99,102,241,0.3)] scale-110' : 'bg-[#0A0A0A]'}
                                ${stageColorClass}
                            `}>
                                {getStageIcon(stage.stage_type)}
                                {highlight && (
                                    <span className="absolute inset-0 rounded-xl animate-pulse bg-current opacity-20 -z-10 scale-125"></span>
                                )}
                            </div>

                            {/* Content Card with Glassmorphism */}
                            <div className={`
                                p-6 rounded-2xl border transition-all duration-300
                                ${highlight ? 'bg-indigo-500/5 border-indigo-500/20 shadow-xl' : 'bg-white/[0.02] border-white/5'}
                                hover:bg-white/[0.05] group
                            `}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-white/5 border border-white/10 ${isPast ? 'text-secondary opacity-50' : 'text-indigo-400'}`}>
                                            Stage {index + 1}
                                        </div>
                                        <div className="font-mono text-xs text-secondary/60">
                                            {format(new Date(stage.date), 'dd.MM.yyyy', { locale: pl })}
                                        </div>
                                    </div>
                                    {stage.bill_number && (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-mono text-secondary group-hover:text-primary transition-colors">
                                            <FileText size={10} />
                                            DRUK {stage.bill_number}
                                        </div>
                                    )}
                                </div>

                                <h4 className={`text-lg font-bold mb-2 ${highlight ? 'text-primary' : 'text-secondary'} group-hover:text-primary transition-colors`}>
                                    {stage.title}
                                </h4>

                                {stage.description && (
                                    <p className={`text-sm leading-relaxed ${isPast ? 'text-secondary/60' : 'text-secondary/90'}`}>
                                        {stage.description}
                                    </p>
                                )}

                                {highlight && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                            {currentVoteId ? 'Current Interaction' : 'LATEST STATUS'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

function dateIsRecent(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.abs(now.getTime() - d.getTime());
    return diff < 1000 * 60 * 60 * 24 * 7;
}

export default LegislativeProcessTimeline;

