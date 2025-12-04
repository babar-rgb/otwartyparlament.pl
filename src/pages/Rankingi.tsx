import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Swords, TrendingDown, AlertTriangle } from 'lucide-react';
import Comparator from './Comparator';
import { supabase } from '../lib/supabase';

interface RankingMP {
  id: number;
  first_name: string;
  last_name: string;
  club: string;
  district: string;
  photo_url: string;
  stats_attendance: number;
  stats_rebellion: number;
}

export default function Rankingi() {
  const [activeTab, setActiveTab] = useState<'attendance_high' | 'attendance_low' | 'rebellion' | 'comparator'>('attendance_high');
  const [mps, setMps] = useState<RankingMP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMps = async () => {
      try {
        const { data, error } = await supabase
          .from('mps')
          .select('id, name, party, district, photo_url, stats_attendance, stats_rebellion')
          .eq('active', true);

        if (error) throw error;

        const mappedMps = data.map((mp: any) => ({
          id: mp.id,
          first_name: mp.name.split(' ')[0],
          last_name: mp.name.split(' ').slice(1).join(' '),
          club: mp.party,
          district: mp.district,
          photo_url: mp.photo_url,
          stats_attendance: mp.stats_attendance || 0,
          stats_rebellion: mp.stats_rebellion || 0,
        }));

        setMps(mappedMps);
      } catch (error) {
        console.error('Error fetching MPs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMps();
  }, []);

  if (loading) return <div className="text-center py-12">Ładowanie rankingów...</div>;

  const rankings = {
    attendance_high: [...mps]
      .sort((a, b) => b.stats_attendance - a.stats_attendance)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.stats_attendance, unit: '%' })),

    attendance_low: [...mps]
      .sort((a, b) => a.stats_attendance - b.stats_attendance)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.stats_attendance, unit: '%' })),

    rebellion: [...mps]
      .sort((a, b) => b.stats_rebellion - a.stats_rebellion)
      .slice(0, 20)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.stats_rebellion, unit: 'głosów przeciw klubowi' })),
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
      'PiS': 'bg-[#800000]',
      'KO': 'bg-[#0096FF]',
      'Polska2050': 'bg-[#00A150]',
      'PSL-TD': 'bg-[#90EE90]',
      'Lewica': 'bg-[#FF0000]',
      'Konfederacja': 'bg-[#000080]',
      'INNE': 'bg-slate-600',
    };
    return colors[party] || 'bg-slate-600';
  };

  const currentRanking = activeTab === 'comparator' ? [] : rankings[activeTab];

  const tabs = [
    { id: 'attendance_high', label: 'Najwyższa Frekwencja', icon: TrendingUp },
    { id: 'attendance_low', label: 'Najniższa Frekwencja', icon: TrendingDown },
    { id: 'rebellion', label: 'Buntownicy', icon: AlertTriangle },
    { id: 'comparator', label: 'Porównywarka', icon: Swords },
  ];

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Trophy size={40} className="text-yellow-500" />
          Rankingi i Analizy
        </h1>
        <p className="text-slate-600 mb-6">
          Sprawdź najbardziej aktywnych i niezależnych posłów. Dane oparte na rzeczywistych głosowaniach.
        </p>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/majatek" className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-2xl">💰</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Ranking Majątków</h3>
                <p className="text-sm text-slate-500">Zobacz kto jest najbogatszym posłem</p>
              </div>
            </div>
            <TrendingUp className="text-emerald-300 group-hover:text-emerald-600 transition-colors" />
          </Link>

          <Link to="/wypowiedzi" className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">🎤</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Wyszukiwarka Wypowiedzi</h3>
                <p className="text-sm text-slate-500">Przeszukaj stenogramy z posiedzeń</p>
              </div>
            </div>
            <TrendingUp className="text-blue-300 group-hover:text-blue-600 transition-colors" />
          </Link>
        </div>
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
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition border-b-2 whitespace-nowrap ${isActive
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
          {activeTab === 'comparator' ? (
            <Comparator embedded={true} />
          ) : (
            <div className="space-y-3">
              {currentRanking.map((entry: any, _: number) => (
                <Link key={entry.id} to={`/poslowie/${entry.id}`}>
                  <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer group">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getRankColor(entry.rank)}`}>
                      {getRankIcon(entry.rank)}
                    </div>

                    <div className="flex-1 flex items-center gap-3">
                      <img
                        src={entry.photo_url || 'https://via.placeholder.com/150'}
                        alt={`${entry.first_name} ${entry.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/150';
                        }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {entry.first_name} {entry.last_name}
                        </p>
                        <p className="text-xs text-slate-500">{entry.district}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`${getPartyColor(entry.club)} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {entry.club}
                      </span>
                    </div>

                    <div className="text-right min-w-24">
                      <p className={`text-2xl font-bold ${activeTab === 'attendance_low' ? 'text-red-600' :
                        activeTab === 'rebellion' ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                        {entry.value}
                        {activeTab === 'attendance_high' || activeTab === 'attendance_low' ? '%' : ''}
                      </p>
                      <p className="text-xs text-slate-500">{entry.unit}</p>
                    </div>

                    <div className="w-32 bg-slate-200 rounded-full h-2 hidden md:block">
                      <div
                        className={`h-2 rounded-full ${activeTab === 'attendance_low' ? 'bg-red-600' :
                          activeTab === 'rebellion' ? 'bg-orange-600' : 'bg-blue-600'
                          }`}
                        style={{
                          width: `${Math.min(100, (entry.value / Math.max(...currentRanking.map((e: any) => e.value))) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Trophy size={20} className="text-yellow-600" />
            O rankingach
          </h3>
          <p className="text-sm text-slate-700">
            Rankingi generowane są automatycznie na podstawie analizy wszystkich głosowań w tej kadencji.
            "Buntownicy" to posłowie, którzy najczęściej głosują inaczej niż większość ich klubu.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-2">Metodologia</h3>
          <p className="text-sm text-slate-700">
            Dane pochodzą z oficjalnych rejestrów Sejmu. Frekwencja liczona jest jako procent udziału w głosowaniach.
          </p>
        </div>
      </div>
    </div>
  );
}


