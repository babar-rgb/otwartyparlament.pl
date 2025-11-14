import { useState } from 'react';
import { mps } from '../data/mockData';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Users, Clock } from 'lucide-react';

export default function Rankingi() {
  const [activeTab, setActiveTab] = useState<'activity' | 'votes' | 'attendance' | 'bills'>('activity');

  const rankings = {
    activity: mps
      .sort((a, b) => b.aktywnosc - a.aktywnosc)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.aktywnosc, unit: '%' })),
    votes: mps
      .sort((a, b) => b.votesCount - a.votesCount)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.votesCount, unit: 'głosów' })),
    attendance: mps
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.attendanceRate, unit: '%' })),
    bills: mps
      .sort((a, b) => b.billsCount - a.billsCount)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.billsCount, unit: 'ustaw' })),
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

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

  const currentRanking = rankings[activeTab];

  const tabs = [
    { id: 'activity', label: 'Aktywność', icon: TrendingUp },
    { id: 'votes', label: 'Głosowania', icon: Users },
    { id: 'attendance', label: 'Obecność', icon: Clock },
    { id: 'bills', label: 'Projekty ustaw', icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Trophy size={40} className="text-yellow-500" />
          Rankingi
        </h1>
        <p className="text-slate-600">
          Sprawdź najbardziej aktywnych posłów w różnych kategoriach.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-200">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition border-b-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <TabIcon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {currentRanking.map((entry: any, idx: number) => (
              <Link key={entry.id} to={`/poslowie/${entry.id}`}>
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getRankColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  <div className="flex-1 flex items-center gap-3">
                    <img src={entry.photoUrl} alt={entry.imie} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {entry.imie} {entry.nazwisko}
                      </p>
                      <p className="text-xs text-slate-500">{entry.district}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`${getPartyColor(entry.party)} text-white text-xs font-bold px-2 py-1 rounded`}>
                      {entry.party}
                    </span>
                  </div>

                  <div className="text-right min-w-20">
                    <p className="text-2xl font-bold text-blue-600">{entry.value}</p>
                    <p className="text-xs text-slate-500">{entry.unit}</p>
                  </div>

                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (entry.value / Math.max(...currentRanking.map((e: any) => e.value))) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-600" />
            O rankingach
          </h3>
          <p className="text-sm text-slate-700">
            Rankingi pokazują najbardziej aktywnych posłów w różnych kategoriach. Wskaźniki aktualizują się codziennie.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-2">Metodologia</h3>
          <p className="text-sm text-slate-700">
            Dane pochodzą z oficjalnych rejestrów Sejmu i są aktualizowane codziennie o 6 rano.
          </p>
        </div>
      </div>
    </div>
  );
}

function FileText(props: any) {
  return <FileText {...props} />;
}
