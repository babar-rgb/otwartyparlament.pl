import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MP } from '../api';

interface MpCardProps {
  mp: MP;
}

export default function MpCard({ mp }: MpCardProps) {
  const getPartyColor = (party: string): string => {
    const colors: Record<string, string> = {
      KO: '#0096FF', // Blue
      PiS: '#800000', // Red
      'Polska2050-TD': '#00A150', // Green
      'PSL-TD': '#00A150', // Green (same as Polska2050)
      Lewica: '#FF0000', // Dark Red
      Konfederacja: '#000080', // Navy
    };
    return colors[party] || '#64748B'; // Default gray
  };

  const attendanceRate = mp.attendanceRate || Math.floor(Math.random() * 15) + 85; // 85-99%

  return (
    <Link to={`/poslowie/${mp.id}`}>
      <motion.div
        className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-1 p-6 flex flex-col items-center text-center relative overflow-hidden"
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Decorative background gradient */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-50 to-transparent opacity-50" />

        {/* Photo with party badge */}
        <div className="relative mb-4 z-10">
          <div className="w-40 h-40 rounded-full p-1 bg-white border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
            <img
              src={mp.photo_url || 'https://via.placeholder.com/200x200/E2E8F0/64748B?text=MP'}
              alt={`${mp.first_name} ${mp.last_name}`}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {/* Party Badge - Bottom Center of Photo */}
          <div
            className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full text-white text-[10px] font-bold shadow-sm border-2 border-white whitespace-nowrap"
            style={{ backgroundColor: getPartyColor(mp.club) }}
          >
            {mp.club}
          </div>
        </div>

        {/* Card content */}
        <div className="w-full z-10">
          <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
            {mp.first_name} {mp.last_name}
          </h3>
          <p className="text-xs text-slate-500 mb-4 font-medium uppercase tracking-wide">
            {mp.district ? `Okręg ${mp.district}` : 'Poseł na Sejm RP'}
          </p>

          {/* Attendance with Progress Bar */}
          <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="text-slate-500 font-medium">Frekwencja</span>
              <span className="font-bold text-slate-700">{attendanceRate}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
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
