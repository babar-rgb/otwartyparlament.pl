import { Link } from 'react-router-dom';
import { Users, FileText } from 'lucide-react';
import { DashboardStats } from '../../hooks/useDashboardData';

interface QuickStatsProps {
    stats: DashboardStats;
}

export default function QuickStats({ stats }: QuickStatsProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Link to="/poslowie" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-1" />
                <span className="text-lg font-black text-slate-900 dark:text-white">{stats.mpsCount}</span>
                <span className="text-[8px] text-slate-500 dark:text-white/30 uppercase tracking-widest font-bold">Posłów</span>
            </Link>
            <Link to="/glosowania" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mb-1" />
                <span className="text-lg font-black text-slate-900 dark:text-white">{stats.votesCount}</span>
                <span className="text-[8px] text-slate-500 dark:text-white/30 uppercase tracking-widest font-bold">Głosowań</span>
            </Link>
        </div>
    );
}
