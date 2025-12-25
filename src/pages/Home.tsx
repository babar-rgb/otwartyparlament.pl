import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  ChevronDown
} from 'lucide-react';
import { expandSearchQuery } from '../utils/searchContext';
import { useTerm } from '../context/TermContext';
import SejmHemicycle from '../components/SejmHemicycle';
import { Skeleton, ChartSkeleton } from '../components/ui/Skeleton';
import SEO from '../components/SEO';
import { useDashboardData } from '../hooks/useDashboardData';
import TopVoteCard from '../components/dashboard/TopVoteCard';
import ActivityCard from '../components/dashboard/ActivityCard';
import QuickStats from '../components/dashboard/QuickStats';

export default function Home() {
  const { term, setTerm } = useTerm();
  const [termDropdownOpen, setTermDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'vote' | 'party'>('vote');

  // Custom hook handles all data fetching
  const { loading, stats, topVote } = useDashboardData();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTermDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060613] dashboard-mesh text-slate-900 dark:text-white pt-24 pb-12 px-4 md:px-8 font-sans transition-all duration-500">
      <SEO
        title="Dashboard | OtwartyParlament.pl"
        description="Monitoruj prace Sejmu na żywo. Analizy AI, wizualizacje głosowań i statystyki kadencji."
      />

      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white m-0">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setTermDropdownOpen(!termDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#16162d] border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1c1c3a] transition-all shadow-sm"
              >
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                <span className="font-bold text-sm tracking-wide text-slate-900 dark:text-white">{term} Kadencja</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 dark:opacity-50 transition-transform duration-300 ${termDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {termDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#16162d] border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 p-1"
                  >
                    {[10, 9].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTerm(t as 9 | 10);
                          setTermDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-between group ${term === t ? 'bg-indigo-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        <span>{t} Kadencja</span>
                        {term === t ? (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        ) : (
                          <span className="text-[10px] opacity-0 group-hover:opacity-40 transition-opacity">WYBIERZ</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 w-4 h-4" />
              <input
                type="text"
                placeholder="Szukaj..."
                className="bg-white dark:bg-[#16162d] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    const query = target.value;
                    const expanded = expandSearchQuery(query).join(',');
                    window.location.href = `/szukaj?q=${query}&expanded=${expanded}`;
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Top Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <TopVoteCard loading={loading} topVote={topVote} />

          {/* Session Date -> /glosowania */}
          {loading ? <Skeleton className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] h-full min-h-[160px]" /> : (
            <Link to="/glosowania" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 flex items-center gap-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group shadow-sm">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">Ostatnie Posiedzenie</p>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">{stats.lastSittingDate}</h4>
              </div>
            </Link>
          )}

          {/* Trending -> /kategorie */}
          {loading ? <Skeleton className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] h-full min-h-[160px]" /> : (
            <Link to="/kategorie" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 flex items-center gap-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group shadow-sm">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 dark:text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">Na topie</p>
                <h4 className="text-xl font-black leading-tight text-slate-900 dark:text-white">{stats.trendingTopic}</h4>
              </div>
            </Link>
          )}
        </div>

        {/* Main Grid: Hemicycle + Activity + QuickStats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Large Card: Plenary Hall */}
          {loading ? <ChartSkeleton /> : (
            <div className="lg:col-span-3 bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group shadow-sm">
              {/* Background Blur decoration */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-12 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white m-0">Sala Plenarna</h2>
                  <p className="text-slate-500 dark:text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Rozkład głosów (Kadencja {term})</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('vote')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${viewMode === 'vote' ? 'bg-slate-200 dark:bg-white/20 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white'}`}
                  >
                    Głosowanie
                  </button>
                  <button
                    onClick={() => setViewMode('party')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${viewMode === 'party' ? 'bg-slate-200 dark:bg-white/20 border-slate-300 dark:border-white/20 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white'}`}
                  >
                    Partie
                  </button>
                </div>
              </div>

              <div className="relative min-h-[400px] flex items-center justify-center">
                {topVote?.results && topVote.results.length > 0 ? (
                  <SejmHemicycle
                    mode={viewMode}
                    data={topVote.results.map((r: any) => ({
                      id: r.mps?.id || r.mp_id,
                      name: r.mps?.name || 'Nieznany',
                      party: r.mps?.party || 'Niezrzeszony',
                      photo_url: r.mps?.photo_url || '',
                      vote: r.vote,
                      seat_number: r.mps?.seat_number
                    }))}
                  />
                ) : (
                  <div className="text-slate-300 dark:text-white/20 font-black text-2xl uppercase tracking-tighter">Wczytywanie mapy...</div>
                )}
              </div>

              {/* Legend Component (Minimal) */}
              <div className="flex flex-wrap justify-center gap-6 mt-12 relative z-10">
                {[
                  { label: 'Lewica', color: '#dc2626' },
                  { label: 'KO', color: '#3b82f6' },
                  { label: 'PL2050', color: '#eab308' },
                  { label: 'PiS', color: '#1d4ed8' },
                  { label: 'Konfederacja', color: '#0f172a' }
                ].map(party => (
                  <div key={party.label} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: party.color }} />
                    <span className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">{party.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column: Topic of the Day Card & QuickStats */}
          <div className="flex flex-col gap-6">
            <ActivityCard loading={loading} />
            <QuickStats stats={stats} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Space Grotesk', sans-serif !important;
        }

        .dashboard-card {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        /* Customize scrollbars for dark theme */
        .dark ::-webkit-scrollbar {
          width: 8px;
        }
        .dark ::-webkit-scrollbar-track {
          background: #060613;
        }
        .dark ::-webkit-scrollbar-thumb {
          background: #111126;
          border-radius: 10px;
        }
        .dark ::-webkit-scrollbar-thumb:hover {
          background: #1c1c3a;
        }
      `}} />
    </div >
  );
}
