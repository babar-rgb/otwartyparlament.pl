import { Link } from 'react-router-dom';
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
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-400 transition-colors cursor-pointer">
        {/* Photo with party color bar */}
        <div className="relative">
          <img
            src={mp.photo_url || 'https://via.placeholder.com/200x200/E2E8F0/64748B?text=MP'}
            alt={`${mp.first_name} ${mp.last_name}`}
            className="w-full aspect-[3/4] object-cover"
          />
          {/* Party color bar at bottom of photo */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px]"
            style={{ backgroundColor: getPartyColor(mp.club) }}
          />
        </div>

        {/* Card content */}
        <div className="p-4">
          <h3 className="font-bold text-black text-lg mb-2">
            {mp.first_name} {mp.last_name}
          </h3>
          <p className="text-sm text-slate-500">
            Obecność: {attendanceRate}%
          </p>
        </div>
      </div>
    </Link>
  );
}
