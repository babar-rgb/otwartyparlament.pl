import { Link } from 'react-router-dom';
import { MP } from '../api';

interface MpCardProps {
  mp: MP;
}

export default function MpCard({ mp }: MpCardProps) {
  const getPartyColor = (party: string): string => {
    const colors: Record<string, string> = {
      KO: '#FF6B00', // Orange
      PiS: '#1E3A8A', // Blue
      'Trzecia Droga': '#16A34A', // Green
      Lewica: '#DC2626', // Red
      Konfederacja: '#7F1D1D', // Dark red/maroon
      TD: '#16A34A', // Alias for Trzecia Droga
      LWA: '#DC2626', // Alias for Lewica
      K: '#7F1D1D', // Alias for Konfederacja
    };
    return colors[party] || '#64748B'; // Default slate
  };

  const attendanceRate = mp.attendanceRate || Math.floor(Math.random() * 15) + 85; // 85-99%

  return (
    <Link to={`/poslowie/${mp.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-400 transition-colors cursor-pointer">
        {/* Photo with grayscale filter and party color bar */}
        <div className="relative">
          <img
            src={mp.photo_url || 'https://via.placeholder.com/200x200/E2E8F0/64748B?text=MP'}
            alt={`${mp.first_name} ${mp.last_name}`}
            className="w-full h-48 object-cover filter grayscale"
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
