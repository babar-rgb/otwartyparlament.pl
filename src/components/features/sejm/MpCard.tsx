import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MP } from '../../../api';

interface MpCardProps {
  mp: MP;
}

export default function MpCard({ mp }: MpCardProps) {
  const getPartyBadge = (party: string): string => {
    const p = party?.toUpperCase() || '';
    // Check Konfederacja FIRST (contains 'KO')
    if (p.includes('KONFEDERACJA')) return 'bg-gradient-to-r from-[#0a1628] to-[#000000] text-white';
    if (p.includes('KO')) return 'bg-gradient-to-r from-orange-500 to-red-600 text-white';
    if (p.includes('PIS')) return 'bg-blue-700 text-white';
    if (p.includes('2050') || p.includes('TD')) return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900';
    if (p.includes('PSL')) return 'bg-green-600 text-white';
    if (p.includes('LEWICA')) return 'bg-gradient-to-r from-purple-600 to-red-500 text-white';
    return 'bg-slate-500 text-white';
  };

  const attendanceRate = mp.attendanceRate || 0;

  return (
    <Link to={`/poslowie/${mp.slug || mp.id}`}>
      <motion.div
        className="group relative bg-surface p-4 rounded-2xl border border-border-base hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 flex flex-col items-center text-center"
        whileTap={{ scale: 0.98 }}
      >
        {/* Compact circular photo to maintain quality */}
        <div className="relative mb-3">
          <div className="absolute -inset-1.5 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img
            src={mp.photo_url || `https://ui-avatars.com/api/?name=${mp.first_name}+${mp.last_name}&background=e2e8f0&color=475569`}
            alt=""
            className="w-12 h-12 rounded-full object-cover object-top border-2 border-white dark:border-slate-800 relative z-10 transition-transform group-hover:scale-110"
            loading="lazy"
          />
        </div>

        <div className="flex-1 w-full space-y-1.5">
          <h3 className="font-bold text-primary text-[13px] leading-tight line-clamp-2 group-hover:text-accent-blue transition-colors">
            {mp.first_name} <span className="block">{mp.last_name}</span>
          </h3>

          <div className="flex flex-col items-center gap-2 pt-1">
            <span className={`px-2 py-0.5 text-[8px] font-black rounded-lg uppercase tracking-wider ${getPartyBadge(mp.club)}`}>
              {mp.club}
            </span>
          </div>

          {/* Simple participation score */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-secondary/40 mb-1">
              <span>Udział</span>
              <span className="text-primary">{attendanceRate}%</span>
            </div>
            <div className="h-1 bg-border-base rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${attendanceRate >= 90 ? 'bg-emerald-500' : attendanceRate >= 70 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
