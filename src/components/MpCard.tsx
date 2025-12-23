import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MP } from '../api';

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
        className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Photo - professional headshot style */}
        <div className="aspect-[3/4] overflow-hidden bg-slate-100 relative">
          <img
            src={mp.photo_url || `https://ui-avatars.com/api/?name=${mp.first_name}+${mp.last_name}&background=e2e8f0&color=475569`}
            alt={`${mp.first_name} ${mp.last_name}`}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 contrast-[1.1] saturate-[1.1] brightness-[1.05]"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 bg-white">
          {/* Name and party */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-tight">
              {mp.first_name} {mp.last_name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getPartyBadge(mp.club)}`}>
                {mp.club}
              </span>
              {mp.district && (
                <span className="text-[11px] text-slate-500">
                  Okręg {mp.district}
                </span>
              )}
            </div>
          </div>

          {/* Attendance stat */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Obecność</span>
              <span className="text-lg font-bold text-slate-900">
                {attendanceRate}<span className="text-xs text-slate-400 font-normal">%</span>
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${attendanceRate >= 90 ? 'bg-emerald-500' : attendanceRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${attendanceRate}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
