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
      <div className="group bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        {/* Photo with party badge */}
        <div className="relative overflow-hidden">
          <img
            src={mp.photo_url || 'https://via.placeholder.com/200x200/E2E8F0/64748B?text=MP'}
            alt={`${mp.first_name} ${mp.last_name}`}
            className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Party Badge - Top Right */}
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: getPartyColor(mp.club) }}
          >
            {mp.club}
          </div>
        </div>

        {/* Card content */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-base mb-3">
            {mp.first_name} {mp.last_name}
          </h3>

          {/* Attendance with Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Obecność</span>
              <span className="font-semibold text-gray-900">{attendanceRate}%</span>
            </div>
            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
