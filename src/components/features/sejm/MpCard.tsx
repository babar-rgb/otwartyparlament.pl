import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MP } from '../../../api';
import Badge from '../../ui/Badge';

interface MpCardProps {
  mp: MP;
}

export default function MpCard({ mp }: MpCardProps) {

  const attendanceRate = mp.attendanceRate || 0;

  return (
    <Link to={`/poslowie/${mp.slug || mp.id}`}>
      <motion.div
        className="group relative bg-surface/50 backdrop-blur-sm p-5 rounded-2xl border border-border-base hover:border-accent-blue/30 transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-accent-blue/5 hover:-translate-y-1 flex flex-col items-center text-center"
        whileTap={{ scale: 0.98 }}
      >
        {/* Compact circular photo to maintain quality */}
        <div className="relative mb-3">
          <div className="absolute -inset-1.5 bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img
            src={mp.photo_url || `https://ui-avatars.com/api/?name=${mp.first_name}+${mp.last_name}&background=1e293b&color=94a3b8`}
            alt=""
            className="w-20 h-20 rounded-full object-cover object-top border-2 border-border-base relative z-10 transition-transform group-hover:scale-110"
            loading="lazy"
          />
        </div>

        <div className="flex-1 w-full space-y-1.5">
          <h3 className="font-bold text-primary text-[15px] leading-tight line-clamp-2 group-hover:text-accent-blue transition-colors">
            {mp.first_name} {mp.last_name && <span className="block">{mp.last_name}</span>}
          </h3>

          <div className="flex flex-col items-center gap-2 pt-1">
            <Badge variant="party" party={mp.club} size="xs">
              {mp.club}
            </Badge>
          </div>

          {/* Simple participation score */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary/40 mb-1">
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
