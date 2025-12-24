import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';

interface ActivityCardProps {
    loading: boolean;
}

export default function ActivityCard({ loading }: ActivityCardProps) {
    if (loading) {
        return <Skeleton className="h-[300px] rounded-[2.5rem] w-full bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5" />;
    }

    return (
        <Link to="/rankingi" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col group min-h-[360px] shadow-sm hover:shadow-md transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="mb-6 z-10">
                <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">Status Prac</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Rankingi Aktywności</h3>
                <p className="text-slate-500 dark:text-white/50 text-sm mt-2 line-clamp-3">
                    Zobacz kogo najczęściej nie ma w pracy i kto składa najwięcej interpelacji.
                </p>
            </div>

            <div className="mt-auto z-10">
                <div className="flex flex-wrap gap-2 justify-start">
                    {[
                        { name: 'PiS', abbr: 'PiS', bg: 'bg-blue-700' },
                        { name: 'KO', abbr: 'KO', bg: 'bg-gradient-to-br from-orange-500 to-red-600' },
                        { name: 'Polska 2050', abbr: '2050', bg: 'bg-yellow-400' },
                        { name: 'PSL', abbr: 'PSL', bg: 'bg-green-600' },
                        { name: 'Lewica', abbr: 'L', bg: 'bg-gradient-to-br from-purple-600 to-red-500' },
                    ].map((party) => (
                        <div
                            key={party.name}
                            className={`w-8 h-8 rounded-full border-2 border-white dark:border-[#111126] flex items-center justify-center shadow-lg ${party.bg}`}
                        >
                            <span className={`text-[8px] font-black ${party.name === 'Polska 2050' ? 'text-slate-900' : 'text-white'}`}>
                                {party.abbr}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Zobacz pełny ranking
                    <ArrowRight className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
