import { Link } from 'react-router-dom';
import { MP } from '../types';
import { Activity, BarChart3 } from 'lucide-react';

interface MpCardProps {
  mp: MP;
}

export default function MpCard({ mp }: MpCardProps) {
  const getPartyColor = (party: string) => {
    const colors: Record<string, string> = {
      PiS: 'bg-blue-600',
      KO: 'bg-orange-600',
      LWA: 'bg-red-600',
      TD: 'bg-green-600',
      K: 'bg-red-900',
    };
    return colors[party] || 'bg-slate-600';
  };

  return (
    <Link to={`/poslowie/${mp.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 hover:shadow-lg hover:border-slate-300 transition overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="relative h-32 bg-gradient-to-b from-slate-200 to-slate-100 overflow-hidden">
          <img
            src={mp.photoUrl}
            alt={`${mp.imie} ${mp.nazwisko}`}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm">
            {mp.imie} {mp.nazwisko}
          </h3>

          <div className="flex items-center gap-2 mt-2 mb-3">
            <span className={`${getPartyColor(mp.party)} text-white text-xs font-bold px-2 py-1 rounded`}>
              {mp.party}
            </span>
            <span className="text-xs text-slate-500">{mp.district}</span>
          </div>

          <p className="text-xs text-slate-600 mb-3 flex-grow">
            Okręg: {mp.district}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 text-xs">
            <div>
              <p className="font-semibold text-blue-600">{mp.votesCount}</p>
              <p className="text-slate-500">Głosów</p>
            </div>
            <div>
              <p className="font-semibold text-green-600">{mp.billsCount}</p>
              <p className="text-slate-500">Ustaw</p>
            </div>
            <div>
              <p className="font-semibold text-purple-600">{mp.attendanceRate}%</p>
              <p className="text-slate-500">Obecność</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Activity size={14} className="text-blue-600" />
              <span className="text-slate-600">Aktywność: {mp.aktywnosc}%</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
