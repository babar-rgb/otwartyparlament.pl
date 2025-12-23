import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swords, TrendingDown, AlertTriangle, ScrollText, ArrowRight, Info, Activity, HandCoins, Mic } from 'lucide-react';
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
  accent: string;
}

export default function Rankingi() {
  const [activeTab, setActiveTab] = useState<'attendance_high' | 'attendance_low' | 'rebellion' | 'comparator' | 'legislation'>('attendance_high');
  const [mps, setMps] = useState<RankingMP[]>([]);
  const [legStats, setLegStats] = useState<LegStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
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
            { label: 'Rządowe', count: gov, color: 'bg-blue-500', accent: 'text-blue-400' },
            { label: 'Poselskie', count: mp, color: 'bg-emerald-500', accent: 'text-emerald-400' },
            { label: 'Senackie', count: senate, color: 'bg-amber-500', accent: 'text-amber-400' },
            { label: 'Komisyjne', count: comm, color: 'bg-slate-400', accent: 'text-slate-300' },
            { label: 'Obywatelskie', count: citizen, color: 'bg-cyan-500', accent: 'text-cyan-400' },
            { label: 'Prezydenckie', count: prez, color: 'bg-rose-500', accent: 'text-rose-400' },
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#06060c] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.4em] text-white/30">System Analytics Loading</p>
      </div>
    );
  }

  const rankings = {
    attendance_high: [...mps]
      .sort((a, b) => b.stats_attendance - a.stats_attendance)
      .slice(0, 50)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.stats_attendance, unit: '%' })),

    attendance_low: [...mps]
      .sort((a, b) => a.stats_attendance - b.stats_attendance)
      .slice(0, 50)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.stats_attendance, unit: '%' })),

    rebellion: [...mps]
      .sort((a, b) => b.stats_rebellion - a.stats_rebellion)
      .slice(0, 50)
      .map((mp, idx) => ({ ...mp, rank: idx + 1, value: mp.stats_rebellion, unit: 'głosów' })),

    legislation: [],
    comparator: []
  };

  const currentRanking = (activeTab === 'comparator' || activeTab === 'legislation') ? [] : rankings[activeTab];

  const tabs = [
    { id: 'attendance_high', label: 'Dyscyplina', icon: Activity },
    { id: 'attendance_low', label: 'Absencja', icon: TrendingDown },
    { id: 'rebellion', label: 'Indywidualizm', icon: AlertTriangle },
    { id: 'legislation', label: 'Inicjatywy', icon: ScrollText },
    { id: 'comparator', label: 'Komparator', icon: Swords },
  ];

  const getPartyBadge = (party: string) => {
    const p = party?.toUpperCase() || '';
    // Check Konfederacja FIRST (contains 'KO')
    if (p.includes('KONFEDERACJA')) return 'bg-gradient-to-r from-[#0a1628] to-[#000000] text-white';
    if (p.includes('KO')) return 'bg-blue-500/10 text-blue-400';
    if (p.includes('PIS')) return 'bg-white/10 text-white/60';
    if (p.includes('PL2050') || p.includes('POLSKA2050')) return 'bg-yellow-500/10 text-yellow-500';
    if (p.includes('LEWICA')) return 'bg-rose-500/10 text-rose-500';
    if (p.includes('PSL')) return 'bg-emerald-500/10 text-emerald-500';
    return 'bg-white/5 text-white/30';
  };

  return (
    <div className="min-h-screen bg-[#06060c] dashboard-mesh text-white pt-32 pb-24 px-4 md:px-8 font-sans transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Section */}
        <div className="mb-16 relative">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-blue-500/20 mb-6 backdrop-blur-md">
            <Activity size={14} className="animate-pulse" />
            Live Intelligence Hub
          </div>
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 flex flex-col md:flex-row md:items-baseline gap-4">
            Analityka <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-400 to-white/40 italic font-serif">Parlamentarna</span>
          </h1>
          <p className="text-white/40 max-w-2xl text-lg font-medium leading-relaxed border-l-2 border-white/10 pl-8">
            Wielowymiarowy ranking aktywności. Przetwarzamy miliony rekordów głosowań, by dostarczyć obiektywny obraz pracy Sejmu X kadencji.
          </p>
        </div>

        {/* Action Grid - Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link to="/majatek" className="group relative bg-[#111126] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl transition-all hover:bg-[#16162d] hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-white/5 group-hover:text-emerald-500/10 group-hover:scale-125 transition-all duration-700">
              <HandCoins size={160} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-8 h-[1px] bg-emerald-500/50"></span>
                Financial Transparency
              </div>
              <h3 className="text-3xl font-black mb-4 group-hover:text-emerald-400 transition-colors">Portfel Sejmu</h3>
              <p className="text-white/40 font-medium max-w-xs mb-8">Systemowa analiza oświadczeń majątkowych. Zobacz stan posiadania Twoich reprezentantów.</p>
              <ArrowRight className="text-white/20 group-hover:text-emerald-500 group-hover:translate-x-4 transition-all duration-500" />
            </div>
          </Link>

          <Link to="/wypowiedzi" className="group relative bg-[#111126] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl transition-all hover:bg-[#16162d] hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-white/5 group-hover:text-blue-500/10 group-hover:scale-125 transition-all duration-700">
              <Mic size={160} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-8 h-[1px] bg-blue-500/50"></span>
                Semantic Analysis
              </div>
              <h3 className="text-3xl font-black mb-4 group-hover:text-blue-400 transition-colors">Analiza Retoryki</h3>
              <p className="text-white/40 font-medium max-w-xs mb-8">Przeszukiwanie stenogramów wspomagane przez AI. Kto realnie dyskutuje, a kto ogranicza się do komunikatów?</p>
              <ArrowRight className="text-white/20 group-hover:text-blue-500 group-hover:translate-x-4 transition-all duration-500" />
            </div>
          </Link>
        </div>

        {/* Dashboard Section */}
        <div className="bg-[#111126] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden backdrop-blur-3xl">
          {/* Navigation Tab - Segmented Style */}
          <div className="bg-black/20 p-2 flex flex-wrap gap-2 border-b border-white/5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'text-white/30 hover:bg-white/5 hover:text-white/60'
                  }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {activeTab === 'comparator' ? (
              <div className="animate-in fade-in duration-700">
                <Comparator embedded={true} />
              </div>
            ) : activeTab === 'legislation' ? (
              /* Legislative Stats - Visual Dashboard */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-700">
                <div className="lg:col-span-5 space-y-10">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white">Inicjatywa Ustawodawcza</h3>
                    <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Podział wg grupy zgłaszającej</p>
                  </div>
                  <div className="space-y-6">
                    {legStats.map((stat, idx) => {
                      const total = legStats.reduce((s, i) => s + i.count, 0);
                      const perc = ((stat.count / total) * 100).toFixed(0);
                      return (
                        <div key={idx} className="group flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">{stat.label}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-mono font-black">{stat.count}</span>
                              <span className={`text-[10px] font-black ${stat.accent}`}>{perc}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div className={`h-full ${stat.color} transition-all duration-1000 ease-out`} style={{ width: `${perc}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="lg:col-span-7 bg-white/5 rounded-[2rem] border border-white/5 p-10 flex flex-col justify-center">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-500">
                      <Info size={24} />
                    </div>
                    <h4 className="text-xl font-black self-center tracking-tight">Veto Monitor & Intelligence</h4>
                  </div>
                  <div className="space-y-6 text-white/50 text-lg leading-relaxed font-medium">
                    <p>Analiza <span className="text-white">druków sejmowych</span> wykazuje dominację ścieżki rządowej, co jest typowe dla parlamentaryzmu gabinetowego. Krytycznym wskaźnikiem jest jednak wzrost odsetka projektów procedowanych w trybie <span className="text-emerald-500">pilnym</span>.</p>
                    <p>Segment <span className="text-amber-500">poselski</span> wykazuje najwyższą korelację z inicjatywami o charakterze wizerunkowym, podczas gdy kluczowe zmiany systemowe pozostają domeną ministerstw.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Ranking List - Tactical Data Look */
              <div className="space-y-1">
                <div className="grid grid-cols-12 px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 border-b border-white/5 mb-4">
                  <div className="col-span-1">RNK</div>
                  <div className="col-span-7">Parlamentarzysta / Klub</div>
                  <div className="col-span-4 text-right">Data Points</div>
                </div>

                <div className="space-y-3">
                  {currentRanking.map((entry: any, idx) => {
                    const progress = (entry.value / Math.max(...currentRanking.map((e: any) => e.value))) * 100;
                    return (
                      <Link
                        key={entry.id}
                        to={`/poslowie/${entry.id}`}
                        className="grid grid-cols-12 items-center px-8 py-6 bg-white/[0.02] border border-white/[0.03] rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all group"
                      >
                        <div className="col-span-1">
                          <span className={`text-2xl font-black italic ${idx < 3 ? 'text-blue-500' : 'text-white/10'}`}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        </div>

                        <div className="col-span-7 flex items-center gap-6 min-w-0">
                          <div className="relative shrink-0">
                            <div className={`absolute -inset-1 rounded-full bg-blue-500 blur-md opacity-0 ${idx < 3 ? 'group-hover:opacity-30' : ''} transition-opacity`}></div>
                            <img
                              src={entry.photo_url || `https://ui-avatars.com/api/?name=${entry.last_name}&background=111126&color=666`}
                              alt=""
                              className="w-14 h-14 rounded-full object-cover border border-white/10 relative z-10"
                            />
                          </div>
                          <div className="truncate">
                            <div className="text-xl font-black text-white group-hover:text-blue-400 transition-colors flex items-center gap-4">
                              <span className="truncate">{entry.first_name} {entry.last_name}</span>
                              <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${getPartyBadge(entry.club)}`}>
                                {entry.club}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest mt-1 font-bold">{entry.district}</div>
                          </div>
                        </div>

                        <div className="col-span-4 flex flex-col items-end gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-mono font-black tabular-nums group-hover:scale-110 transition-transform origin-right">
                              {entry.value}<span className="text-sm text-white/20">{entry.unit === '%' ? '%' : ''}</span>
                            </span>
                          </div>
                          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${activeTab === 'attendance_low' ? 'bg-rose-600' : 'bg-blue-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Methodology Footnotes */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <div className="w-6 h-[1px] bg-white/20"></div>
              Engine Version
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Baza danych synchronizowana w czasie rzeczywistym z API Sejmu RP. Algorytm weryfikuje kworum i status każdego aktu prawnego.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <div className="w-6 h-[1px] bg-white/20"></div>
              Data Integrity
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Wskaźnik "Indywidualizm" jest obliczany na podstawie korelacji kross-klubowej, eliminując błędy statystyczne wynikające z pomyłek technicznych posłów.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
              <div className="w-6 h-[1px] bg-white/20"></div>
              Legal Notice
            </div>
            <p className="text-xs text-white/40 leading-relaxed font-medium">Zestawienia mają charakter statystyczny i służą do analizy ilościowej. Nie stanowią oceny merytorycznej pracy poszczególnych posłów.</p>
          </div>
        </div>
      </div>
    </div >
  );
}
