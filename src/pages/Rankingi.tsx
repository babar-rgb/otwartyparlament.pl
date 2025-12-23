import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, Swords, TrendingDown, AlertTriangle, Medal, HandCoins, Mic, ScrollText } from 'lucide-react';
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

interface LegStat {
  label: string;
  count: number;
  color: string;
}

export default function Rankingi() {
  const [activeTab, setActiveTab] = useState<'attendance_high' | 'attendance_low' | 'rebellion' | 'comparator' | 'legislation'>('attendance_high');
  const [mps, setMps] = useState<RankingMP[]>([]);
  const [legStats, setLegStats] = useState<LegStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load MPs
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

        // 2. Load Prints
        const { data: printsData } = await supabase.from('sejm_prints').select('title');

        if (printsData) {
          let gov = 0, mp = 0, senate = 0, citizen = 0, comm = 0, prez = 0;
          printsData.forEach((p: any) => {
            const t = p.title.toLowerCase();
            if (t.includes('rządowy')) gov++;
            else if (t.includes('poselski')) mp++;
            else if (t.includes('senacki')) senate++;
            else if (t.includes('obywatelski')) citizen++;
            else if (t.includes('komisyjny')) comm++;
            else if (t.includes('prezydent')) prez++;
          });

          setLegStats([
            { label: 'Rządowe', count: gov, color: 'bg-blue-500' },
            { label: 'Poselskie', count: mp, color: 'bg-indigo-500' },
            { label: 'Senackie', count: senate, color: 'bg-orange-500' },
            { label: 'Komisyjne', count: comm, color: 'bg-slate-500' },
            { label: 'Obywatelskie', count: citizen, color: 'bg-green-500' },
            { label: 'Prezydenckie', count: prez, color: 'bg-red-500' },
          ].sort((a, b) => b.count - a.count));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

    legislation: [], // Handled separately
    comparator: []
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-100 text-blue-800';
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

  const currentRanking = (activeTab === 'comparator' || activeTab === 'legislation') ? [] : rankings[activeTab];

  const tabs = [
    { id: 'attendance_high', label: 'Najwyższa Frekwencja', icon: TrendingUp },
    { id: 'attendance_low', label: 'Najniższa Frekwencja', icon: TrendingDown },
    { id: 'rebellion', label: 'Wyłamali się', icon: AlertTriangle },
    { id: 'legislation', label: 'Aktywność Legislacyjna', icon: ScrollText },
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
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <HandCoins size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Ranking Majątków</h3>
                <p className="text-sm text-slate-500">Zobacz kto jest najbogatszym posłem</p>
              </div>
            </div>
            <TrendingUp className="text-emerald-300 group-hover:text-emerald-600 transition-colors" />
          </Link>

          <Link to="/wypowiedzi" className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Mic size={24} />
              </div>
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
          ) : activeTab === 'legislation' ? (
            /* Legislative Stats View - Custom Premium Design */
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 mb-2">
                  Kto pisze prawo w Polsce?
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Analiza {legStats.reduce((sum, item) => sum + item.count, 0)} projektów ustaw (druków sejmowych z X kadencji).
                </p>
              </div>

              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Custom Pie Chart */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50 backdrop-blur">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Podział projektów</h3>
                  <div className="relative w-48 h-48 mx-auto">
                    {/* Conic gradient pie chart */}
                    <div
                      className="w-full h-full rounded-full"
                      style={{
                        background: (() => {
                          const total = legStats.reduce((sum, item) => sum + item.count, 0);
                          const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e', '#06b6d4'];
                          let gradient = 'conic-gradient(';
                          let cumulative = 0;
                          legStats.forEach((stat, idx) => {
                            const percentage = (stat.count / total) * 100;
                            gradient += `${colors[idx]} ${cumulative}% ${cumulative + percentage}%`;
                            cumulative += percentage;
                            if (idx < legStats.length - 1) gradient += ', ';
                          });
                          gradient += ')';
                          return gradient;
                        })()
                      }}
                    >
                      {/* Inner circle for donut effect */}
                      <div className="absolute inset-6 rounded-full bg-white dark:bg-slate-800/50 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-slate-900 dark:text-white">
                            {legStats.reduce((sum, item) => sum + item.count, 0)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">projektów</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="mt-6 grid grid-cols-2 gap-2">
                    {legStats.map((stat, idx) => {
                      const colors = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colors[idx]}`} />
                          <span className="text-xs text-slate-600 dark:text-slate-400 truncate">{stat.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {legStats.slice(0, 6).map((stat, idx) => {
                    const total = legStats.reduce((sum, item) => sum + item.count, 0);
                    const percentage = total > 0 ? (stat.count / total) * 100 : 0;
                    const gradients = [
                      'from-blue-500 to-blue-600',
                      'from-violet-500 to-violet-600',
                      'from-amber-500 to-amber-600',
                      'from-emerald-500 to-emerald-600',
                      'from-rose-500 to-rose-600',
                      'from-cyan-500 to-cyan-600'
                    ];
                    const bgColors = [
                      'bg-blue-500',
                      'bg-violet-500',
                      'bg-amber-500',
                      'bg-emerald-500',
                      'bg-rose-500',
                      'bg-cyan-500'
                    ];
                    return (
                      <div
                        key={idx}
                        className="group bg-white dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-all hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-12 rounded-full bg-gradient-to-b ${gradients[idx]}`} />
                            <div>
                              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.count}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">udział</p>
                            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                        {/* Animated progress bar */}
                        <div className="h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bgColors[idx]} transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/50">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Porównanie liczby projektów</h3>
                <div className="space-y-4">
                  {legStats.map((stat, idx) => {
                    const maxCount = Math.max(...legStats.map(s => s.count));
                    const percentage = (stat.count / maxCount) * 100;
                    const colors = ['bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-cyan-500'];
                    return (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{stat.count}</span>
                        </div>
                        <div className="h-8 bg-slate-100 dark:bg-slate-700/30 rounded-lg overflow-hidden">
                          <div
                            className={`h-full ${colors[idx]} rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3`}
                            style={{ width: `${percentage}%` }}
                          >
                            {percentage > 15 && (
                              <span className="text-xs font-bold text-white/90">{stat.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Insight Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800/50">
                <p className="text-blue-800 dark:text-blue-300">
                  <strong>💡 Wniosek:</strong> Rządowi przypada większość inicjatywy ustawodawczej ({legStats.find(s => s.label === 'Rządowe')?.count || 0} projektów, {((legStats.find(s => s.label === 'Rządowe')?.count || 0) / legStats.reduce((sum, item) => sum + item.count, 0) * 100).toFixed(0)}%). Projekty poselskie są drugą siłą, ale często dotyczą uchwał okolicznościowych.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentRanking.map((entry: any) => (
                <Link key={entry.id} to={`/poslowie/${entry.id}`}>
                  <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer group">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${getRankColor(entry.rank)}`}>
                      {entry.rank === 1 ? <Medal size={24} className="text-yellow-600" /> :
                        entry.rank === 2 ? <Medal size={24} className="text-gray-600" /> :
                          entry.rank === 3 ? <Medal size={24} className="text-orange-600" /> :
                            <span className="font-mono text-slate-600">#{entry.rank}</span>}
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
            "Wyłamali się" to posłowie, którzy najczęściej głosują inaczej niż większość ich klubu.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-2">Metodologia</h3>
          <p className="text-sm text-slate-700">
            Dane pochodzą z oficjalnych rejestrów Sejmu. Frekwencja liczona jest jako procent udziału w głosowaniach.
          </p>
        </div>
      </div>
    </div >
  );
}


