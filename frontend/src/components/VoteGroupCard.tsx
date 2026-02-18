import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Vote } from '../types/domain';
import { getCategoryStyles } from '../utils/voteStyles';
import { cleanSejmTitle } from '../utils/titleFormatter';
import VoteConnections from './VoteConnections';


interface VoteGroupCardProps {
    vote: Vote;
}

const VoteGroupCard = ({ vote }: VoteGroupCardProps) => {
    const [expanded, setExpanded] = useState(false);
    const styles = getCategoryStyles(vote.topic);
    const childrenRequest = (vote as any).children || [];
    // Sort children by voting number
    const children = [...childrenRequest].sort((a, b) => (a.voting_number || 0) - (b.voting_number || 0));

    return (
        <div className={`group bg-surface border transition-all shadow-sm rounded-[var(--radius-card-md)] ${styles.border} ${styles.bg} ${expanded ? 'ring-2 ring-offset-2 ring-blue-500/20' : 'hover:shadow-xl hover:shadow-accent-blue/5'}`}>
            {/* MAIN HEADER - Click to Expand or Link? Better to expand on card click, link on title? */}
            <div
                onClick={() => setExpanded(!expanded)}
                className="p-6 cursor-pointer"
            >
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    {/* Date Badge */}
                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full shrink-0 transition-all border relative overflow-hidden group-hover:scale-105 ${styles.border} ${styles.badge}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-5 group-hover:opacity-10`} />
                        <span className="text-[10px] font-bold uppercase opacity-60 relative z-10">
                            {new Date(vote.date).toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-2xl font-black relative z-10">{new Date(vote.date).getDate()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                        {/* Meta Tags */}
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase tracking-wider">
                                <Layers size={10} className="stroke-[3]" />
                                PAKIET GŁOSOWAŃ
                            </div>
                            <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${styles.gradient}`} />
                            <span className="px-3 py-1 bg-white/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-lg">
                                Posiedzenie {vote.sitting}
                            </span>
                        </div>

                        {/* Title */}
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-lg md:text-xl font-bold text-primary group-hover:text-accent-blue transition-colors leading-tight mb-2">
                                {vote.street_title || vote.title_clean || cleanSejmTitle(vote.title)}
                            </h3>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded(!expanded);
                                }}
                                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                            >
                                {expanded ? <ChevronUp size={20} className="text-secondary" /> : <ChevronDown size={20} className="text-secondary" />}
                            </button>
                        </div>

                        {/* Footer / Stats */}
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${vote.verdict === 'PRZYJĘTO'
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                }`}>
                                {vote.verdict} (FINAŁ)
                            </div>

                            <VoteConnections voteId={vote.id} />

                            <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md opacity-60">
                                + {children.length} poprawek / głosowań
                            </span>
                        </div>
                    </div>

                    {/* Result Icon */}
                    {/* MP Vote Logic if needed */}
                </div>
            </div>

            {/* EXPANDED CONTENT */}
            {expanded && (
                <div className="border-t border-border-base bg-black/5 dark:bg-black/20 p-4 space-y-2 animate-slide-down">
                    <div className="text-[10px] font-bold uppercase text-secondary tracking-widest mb-2 pl-2">
                        Głosowania Składowe (Poprawki)
                    </div>

                    {/* Final Vote Link */}
                    <Link
                        to={`/glosowania/${vote.term}/${vote.sitting}/${vote.voting_number}`}
                        className="block mb-4 text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-600/20"
                    >
                        Zobacz finałowe głosowanie i szczegóły
                    </Link>

                    {children.map((child: Vote) => (
                        <Link
                            key={child.id}
                            to={`/glosowania/${child.term}/${child.sitting}/${child.voting_number}`}
                            className="block bg-surface hover:bg-white border border-transparent hover:border-border-base p-3 rounded-xl transition-all group/child flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <span className="text-xs font-mono font-bold text-secondary/50 min-w-[24px]">
                                    #{child.voting_number}
                                </span>
                                <span className="text-sm font-medium text-primary line-clamp-1 group-hover/child:text-blue-500 transition-colors">
                                    {child.street_title || child.title_clean || cleanSejmTitle(child.title)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${child.verdict === 'PRZYJĘTO' ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'
                                    }`}>
                                    {child.verdict}
                                </span>
                                <ArrowRight size={14} className="text-secondary/30 group-hover/child:text-blue-500 group-hover/child:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoteGroupCard;
