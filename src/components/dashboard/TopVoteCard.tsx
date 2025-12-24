import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CardSkeleton } from '../ui/Skeleton';
import { TopVote } from '../../hooks/useDashboardData';

interface TopVoteCardProps {
    loading: boolean;
    topVote: TopVote | null;
}

export default function TopVoteCard({ loading, topVote }: TopVoteCardProps) {
    if (loading) return <CardSkeleton />;

    return (
        <div className="md:col-span-2 bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 relative overflow-hidden group shadow-sm flex flex-col justify-between">
            <Link to={topVote ? `/glosowanie/${topVote.id}` : "/glosowania"} className="absolute inset-0 z-20" />
            <div className="absolute top-0 right-0 p-6 z-10">
                <p className="text-slate-400 dark:text-white/30 text-xs font-black font-mono">
                    {topVote ? new Date(topVote.date).toISOString().split('T')[0] : '---'}
                </p>
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">
                        TEMAT DNIA
                    </span>
                    {topVote?.ux_category && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            #{topVote.ux_category}
                        </span>
                    )}
                </div>
                <h3 className="text-2xl font-black leading-tight text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {topVote?.title || "Wybór Marszałka Sejmu X Kadencji"}
                </h3>
                <p className="text-slate-600 dark:text-white/60 text-sm leading-relaxed italic line-clamp-2 max-w-xl">
                    "{topVote?.summary || "Najważniejsza decyzja polityczna rozpoczęcia nowej kadencji."}"
                </p>
            </div>

            <div className="mt-6 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider group-hover:translate-x-2 transition-transform">
                    Analiza AI
                    <ArrowRight className="w-4 h-4" />
                </div>
                <div className="h-1.5 w-32 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-full animate-pulse" />
                </div>
            </div>
        </div>
    );
}
