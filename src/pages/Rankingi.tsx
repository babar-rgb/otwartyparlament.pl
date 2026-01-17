import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Swords, TrendingDown, AlertTriangle, ScrollText, ArrowRight, Info, Activity, HandCoins, Mic } from 'lucide-react';
import Comparator from './Comparator';
import { useRankings } from '../hooks/useRankings';
import { RankingEntry } from '../types/domain';

export default function Rankingi() {
  const [activeTab, setActiveTab] = useState<'attendance_high' | 'attendance_low' | 'rebellion' | 'comparator' | 'legislation'>('attendance_high');
  const { mps, legStats, loading } = useRankings();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-page gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-border-base rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-accent-blue rounded-full animate-spin"></div>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.4em] text-secondary">Wczytywanie Danych Analitycznych</p>
      </div>
    );
  }

  const rankings: Record<string, RankingEntry[]> = {
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

  const currentRanking: RankingEntry[] = (activeTab === 'comparator' || activeTab === 'legislation') ? [] : rankings[activeTab];

  const tabs = [
    { id: 'attendance_high', label: 'Dyscyplina', icon: Activity },
    { id: 'attendance_low', label: 'Absencja', icon: TrendingDown },
    { id: 'rebellion', label: 'Indywidualizm', icon: AlertTriangle },
    { id: 'legislation', label: 'Inicjatywy', icon: ScrollText },
    { id: 'comparator', label: 'Komparator', icon: Swords },
  ];

  const getPartyBadge = (party: string) => {
    const p = party?.toUpperCase() || '';
    if (p.includes('KONFEDERACJA')) return 'bg-slate-900 text-white border border-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-white';
    if (p.includes('KO')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
    if (p.includes('PIS')) return 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border border-blue-600/20';
    if (p.includes('PL2050') || p.includes('POLSKA2050')) return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border border-yellow-500/20';
    if (p.includes('LEWICA')) return 'bg-rose-500/10 text-rose-600 dark:text-rose-500 border border-rose-500/20';
    if (p.includes('PSL')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20';
    return 'bg-surface text-secondary border border-border-base';
  };

  return (
    <div className="min-h-screen bg-page dashboard-mesh text-primary pt-32 pb-24 px-4 md:px-8 font-sans transition-all duration-500">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header Section */}
        <div className="mb-16 relative">
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-6 flex flex-col md:flex-row md:items-baseline gap-4 text-primary">
            Analityka <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-primary/40 italic font-serif">Parlamentarna</span>
          </h1>
          <p className="text-secondary max-w-2xl text-lg font-medium leading-relaxed border-l-2 border-border-base pl-8">
            Wielowymiarowy ranking aktywności. Przetwarzamy miliony rekordów głosowań, by dostarczyć obiektywny obraz pracy Sejmu X kadencji.
          </p>
        </div>

        {/* Action Grid - Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link to="/majatek" className="group relative bg-surface p-10 rounded-[2.5rem] border border-border-base shadow-sm transition-all hover:shadow-xl hover:shadow-accent-blue/5 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-primary/5 group-hover:text-emerald-500/10 group-hover:scale-125 transition-all duration-700">
              <HandCoins size={160} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-8 h-[1px] bg-emerald-500/50"></span>
                Jawność Finansowa
              </div>
              <h3 className="text-3xl font-black mb-4 group-hover:text-emerald-600 transition-colors">Portfel Sejmu</h3>
              <p className="text-secondary font-medium max-w-xs mb-8">Systemowa analiza oświadczeń majątkowych. Zobacz stan posiadania Twoich reprezentantów.</p>
              <ArrowRight className="text-secondary opacity-30 group-hover:text-emerald-500 group-hover:translate-x-4 transition-all duration-500" />
            </div>
          </Link>

          <Link to="/wypowiedzi" className="group relative bg-surface p-10 rounded-[2.5rem] border border-border-base shadow-sm transition-all hover:shadow-xl hover:shadow-accent-blue/5 hover:-translate-y-1 overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-primary/5 group-hover:text-accent-blue/10 group-hover:scale-125 transition-all duration-700">
              <Mic size={160} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-accent-blue text-[10px] font-black uppercase tracking-widest mb-4">
                <span className="w-8 h-[1px] bg-accent-blue/50"></span>
                Analiza Tematyczna
              </div>
              <h3 className="text-3xl font-black mb-4 group-hover:text-accent-blue transition-colors">Analiza Retoryki</h3>
              <p className="text-secondary font-medium max-w-xs mb-8">Przeszukiwanie stenogramów wspomagane przez AI. Kto realnie dyskutuje, a kto ogranicza się do komunikatów?</p>
              <ArrowRight className="text-secondary opacity-30 group-hover:text-accent-blue group-hover:translate-x-4 transition-all duration-500" />
            </div>
          </Link>
        </div>

        {/* Dashboard Section */}
        <div className="bg-surface rounded-[3rem] border border-border-base shadow-2xl overflow-hidden backdrop-blur-3xl">
          {/* Navigation Tab - Segmented Style */}
          <div className="bg-black/5 dark:bg-black/40 p-2 flex flex-wrap gap-2 border-b border-border-base overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id
                  ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20'
                  : 'text-secondary hover:bg-accent-blue/5 hover:text-primary'
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
                    <h3 className="text-2xl font-black text-primary">Inicjatywa Ustawodawcza</h3>
                    <p className="text-secondary text-xs font-bold uppercase tracking-widest">Podział wg grupy zgłaszającej</p>
                  </div>
                  <div className="space-y-6">
                    {legStats.map((stat, idx) => {
                      const total = legStats.reduce((s, i) => s + i.count, 0);
                      const perc = ((stat.count / total) * 100).toFixed(0);
                      return (
                        <div key={idx} className="group flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary group-hover:text-primary transition-colors">{stat.label}</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-mono font-black text-primary">{stat.count}</span>
                              <span className={`text-[10px] font-black ${stat.accent}`}>{perc}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${stat.color} transition-all duration-1000 ease-out`} style={{ width: `${perc}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="lg:col-span-7 bg-page/50 dark:bg-white/5 rounded-[2rem] border border-border-base p-10 flex flex-col justify-center shadow-inner">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center text-accent-blue">
                      <div className="p-2 bg-accent-blue/10 rounded-lg">
                        <Info size={24} />
                      </div>
                    </div>
                    <h4 className="text-xl font-black self-center tracking-tight text-primary">Monitoring Głosowań</h4>
                  </div>
                  <div className="space-y-6 text-secondary text-lg leading-relaxed font-medium">
                    <p>Analiza <span className="text-primary">druków sejmowych</span> wykazuje dominację ścieżki rządowej, co jest typowe dla parlamentaryzmu gabinetowego. Krytycznym wskaźnikiem jest jednak wzrost odsetka projektów procedowanych w trybie <span className="text-emerald-600 dark:text-emerald-500">pilnym</span>.</p>
                    <p>Segment <span className="text-amber-500">poselski</span> wykazuje najwyższą korelację z inicjatywami o charakterze wizerunkowym, podczas gdy kluczowe zmiany systemowe pozostają domeną ministerstw.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Ranking List - Tactical Data Look */
              <div className="space-y-1">
                <div className="grid grid-cols-12 px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-secondary border-b border-border-base mb-4 opacity-50">
                  <div className="col-span-1">RNK</div>
                  <div className="col-span-7">Parlamentarzysta / Klub</div>
                  <div className="col-span-4 text-right">Data Points</div>
                </div>

                <div className="space-y-3">
                  {currentRanking.map((entry, idx) => {
                    const maxVal = Math.max(...currentRanking.map((e) => e.value));
                    const progress = (entry.value / (maxVal || 1)) * 100;
                    return (
                      <Link
                        key={entry.id}
                        to={`/poslowie/${entry.id}`}
                        className="grid grid-cols-12 items-center px-8 py-6 bg-surface border border-border-base rounded-2xl hover:bg-accent-blue/5 hover:border-accent-blue/20 hover:shadow-xl transition-all group"
                      >
                        <div className="col-span-1">
                          <span className={`text-2xl font-black italic ${idx < 3 ? 'text-accent-blue' : 'text-secondary/20'}`}>
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                        </div>

                        <div className="col-span-7 flex items-center gap-6 min-w-0">
                          <div className="relative shrink-0">
                            <div className={`absolute -inset-1 rounded-full bg-accent-blue blur-md opacity-0 ${idx < 3 ? 'group-hover:opacity-30' : ''} transition-opacity`}></div>
                            <img
                              src={entry.photo_url || `https://ui-avatars.com/api/?name=${entry.last_name}&background=111126&color=666`}
                              alt=""
                              className="w-14 h-14 rounded-full object-cover border border-border-base relative z-10"
                            />
                          </div>
                          <div className="truncate">
                            <div className="text-xl font-black text-primary group-hover:text-accent-blue transition-colors flex items-center gap-4">
                              <span className="truncate">{entry.first_name} {entry.last_name}</span>
                              <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest ${getPartyBadge(entry.club)}`}>
                                {entry.club}
                              </span>
                            </div>
                            <div className="text-[10px] text-secondary uppercase tracking-widest mt-1 font-bold">{entry.district}</div>
                          </div>
                        </div>

                        <div className="col-span-4 flex flex-col items-end gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-mono font-black tabular-nums text-primary group-hover:scale-110 transition-transform origin-right">
                              {entry.value}<span className="text-sm text-secondary">{entry.unit === '%' ? '%' : ''}</span>
                            </span>
                          </div>
                          <div className="w-32 h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${activeTab === 'attendance_low' ? 'bg-rose-600' : 'bg-accent-blue'}`}
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
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-border-base pt-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
              <div className="w-6 h-[1px] bg-border-base"></div>
              Wersja Systemu
            </div>
            <p className="text-xs text-secondary leading-relaxed font-medium">Baza danych synchronizowana w czasie rzeczywistym z API Sejmu RP. Algorytm weryfikuje kworum i status każdego aktu prawnego.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
              <div className="w-6 h-[1px] bg-border-base"></div>
              Integralność Danych
            </div>
            <p className="text-xs text-secondary leading-relaxed font-medium">Wskaźnik "Indywidualizm" jest obliczany na podstawie korelacji kross-klubowej, eliminując błędy statystyczne wynikające z pomyłek technicznych posłów.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
              <div className="w-6 h-[1px] bg-border-base"></div>
              Nota Prawna
            </div>
            <p className="text-xs text-secondary leading-relaxed font-medium">Zestawienia mają charakter statystyczny i służą do analizy ilościowej. Nie stanowią oceny merytorycznej pracy poszczególnych posłów.</p>
          </div>
        </div>
      </div>
    </div >
  );
}
