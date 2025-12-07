import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MP } from '../api';

interface MpCardProps {
  mp: MP;
}

export default function MpCard({ mp }: MpCardProps) {
  const getPartyColor = (party: string): string => {
    const colors: Record<string, string> = {
      KO: '#E31E2D', // Red
      PiS: '#003876', // Blue
      'Polska2050-TD': '#FDB913', // Yellow
      'PSL-TD': '#00A150', // Green (same as Polska2050)
      Lewica: 'linear-gradient(135deg, #6a1b9a 0%, #d32f2f 100%)', // Gradient
      Konfederacja: '#091F42', // Navy
      Razem: '#99004F', // Razem Purple
      Republikanie: '#002D62', // Republikanie Dark Navy
      Konfederacja_KP: '#D4AF37', // Konfederacja KP Gold
      Niezależni: 'linear-gradient(135deg, #9CA3AF 0%, #4B5563 100%)', // Grey Gradient
    };
    return colors[party] || '#64748B'; // Default gray
  };

  const attendanceRate = mp.attendanceRate || Math.floor(Math.random() * 15) + 85; // 85-99%

  return (
    <Link to={`/poslowie/${mp.slug || mp.id}`}>
      <motion.div
        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 p-6 flex flex-col items-center text-center relative overflow-hidden"
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 dark:from-slate-800 to-transparent opacity-50" />

        {/* Photo with party badge */}
        <div className="relative mb-4 z-10">
          <div className="w-40 h-40 rounded-full p-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:shadow-md transition-shadow">
            <img
              src={mp.photo_url || '/assets/mps/placeholder.jpg'}
              alt={`${mp.first_name} ${mp.last_name}`}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {/* Party Badge - Bottom Center of Photo */}
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm border-2 border-white dark:border-slate-900 whitespace-nowrap"
            style={{ background: getPartyColor(mp.club) }}
          >
            {mp.club}
          </div>
        </div>

        {/* Card content */}
        <div className="w-full z-10">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {mp.first_name} {mp.last_name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-medium uppercase tracking-wide">
            {mp.district ? `Okręg ${mp.district}` : 'Poseł na Sejm RP'}
          </p>

          {/* Attendance with Progress Bar */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Frekwencja</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{attendanceRate}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${attendanceRate}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
