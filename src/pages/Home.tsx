import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  ChevronDown,
  Users,
  FileText,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { handleSearchNavigation } from '../utils/searchContext';
import { useTerm } from '../context/TermContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useNavigate } from 'react-router-dom';
import SejmHemicycle from '../components/features/sejm/SejmHemicycle';
import Skeleton from '../components/ui/Skeleton';
import SEO from '../components/SEO';
import { useDashboardData } from '../hooks/useDashboardData';
import TopVoteCard from '../components/dashboard/TopVoteCard';
import ActivityCard from '../components/dashboard/ActivityCard';
import QuickStats from '../components/dashboard/QuickStats';
import SittingSummaryCard from '../components/SittingSummaryCard';

// Senior Dashboard Component
const SeniorDashboard = () => (
  <div className="container mx-auto px-6 py-12 max-w-4xl">
    <div className="text-center mb-16">
      <h1 className="text-4xl md:text-5xl font-black mb-6 text-black tracking-tight" style={{ fontWeight: 900 }}>
        Dzień Dobry.
      </h1>
      <p className="text-xl md:text-2xl text-gray-800 font-bold leading-relaxed max-w-2xl mx-auto">
        To jest uproszczony widok serwisu. Wybierz co chcesz zrobić, klikając w jeden z dużych przycisków poniżej.
      </p>
    </div>

    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <Link to="/poslowie" className="group bg-white border-4 border-black rounded-3xl p-8 hover:bg-yellow-50 transition-colors flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-200 min-h-[140px]">
        <div className="flex items-center gap-8">
          <div className="bg-black text-white p-5 rounded-2xl shrink-0">
            <Users size={56} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <span className="block text-3xl font-black text-black mb-2">Znajdź Posła</span>
            <span className="text-xl font-bold text-gray-600 block leading-tight">Sprawdź kim są Twoi reprezentanci</span>
          </div>
        </div>
        <ArrowRight size={40} className="text-black group-hover:translate-x-2 transition-transform shrink-0 ml-4" />
      </Link>

      <Link to="/glosowania" className="group bg-white border-4 border-black rounded-3xl p-8 hover:bg-yellow-50 transition-colors flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-200 min-h-[140px]">
        <div className="flex items-center gap-8">
          <div className="bg-black text-white p-5 rounded-2xl shrink-0">
            <FileText size={56} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <span className="block text-3xl font-black text-black mb-2">Głosowania</span>
            <span className="text-xl font-bold text-gray-600 block leading-tight">Zobacz jak głosowali posłowie</span>
          </div>
        </div>
        <ArrowRight size={40} className="text-black group-hover:translate-x-2 transition-transform shrink-0 ml-4" />
      </Link>

      <Link to="/posiedzenia/historia" className="group bg-white border-4 border-black rounded-3xl p-8 hover:bg-yellow-50 transition-colors flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-200 min-h-[140px]">
        <div className="flex items-center gap-8">
          <div className="bg-black text-white p-5 rounded-2xl shrink-0">
            <Calendar size={56} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <span className="block text-3xl font-black text-black mb-2">Posiedzenia</span>
            <span className="text-xl font-bold text-gray-600 block leading-tight">Co dzieje się w Sejmie?</span>
          </div>
        </div>
        <ArrowRight size={40} className="text-black group-hover:translate-x-2 transition-transform shrink-0 ml-4" />
      </Link>

      <Link to="/kontakt" className="group bg-white border-4 border-black rounded-3xl p-8 hover:bg-yellow-50 transition-colors flex items-center justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] duration-200 min-h-[140px]">
        <div className="flex items-center gap-8">
          <div className="bg-black text-white p-5 rounded-2xl shrink-0">
            <HelpCircle size={56} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <span className="block text-3xl font-black text-black mb-2">Pomoc</span>
            <span className="text-xl font-bold text-gray-600 block leading-tight">Potrzebujesz wyjaśnienia?</span>
          </div>
        </div>
        <ArrowRight size={40} className="text-black group-hover:translate-x-2 transition-transform shrink-0 ml-4" />
      </Link>
    </div>

    <div className="mt-16 p-8 bg-gray-100 rounded-3xl border-2 border-gray-300 text-center">
      <h3 className="text-xl font-bold text-black mb-2">Potrzebujesz zmienić wielkość tekstu?</h3>
      <p className="text-lg text-gray-700 mb-6">Użyj przycisków w menu bocznym (ikona trzech kresek w rogu).</p>
    </div>
  </div>
);

export default function Home() {
  const navigate = useNavigate();
  const { term, setTerm } = useTerm();
  const [termDropdownOpen, setTermDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'vote' | 'party'>('vote');
  const { isSimpleMode } = useAccessibility();

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
    <div className="min-h-screen bg-page text-primary pt-24 pb-12 px-4 md:px-8 font-sans transition-all duration-500">
      <SEO
        title={isSimpleMode ? "Prosty Widok | OtwartyParlament.pl" : "Dashboard | OtwartyParlament.pl"}
        description="Monitoruj prace Sejmu na żywo. Analizy AI, wizualizacje głosowań i statystyki kadencji."
      />

      {isSimpleMode ? (
        <SeniorDashboard />
      ) : (
        <div className="container mx-auto max-w-7xl">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-blue/20 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-accent-blue" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-primary m-0">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setTermDropdownOpen(!termDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-border-base rounded-[var(--radius-badge)] hover:bg-hover transition-all shadow-sm"
                >
                  <div className="w-2 h-2 bg-accent-blue rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  <span className="font-bold text-sm tracking-wide text-primary">{term} Kadencja</span>
                  <ChevronDown className={`w-4 h-4 text-secondary transition-transform duration-300 ${termDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {termDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border-base rounded-[var(--radius-badge)] shadow-2xl overflow-hidden z-50 p-1"
                    >
                      {[10, 9].map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setTerm(t as 9 | 10);
                            setTermDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-between group ${term === t
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-transparent hover:bg-hover text-slate-700 dark:text-slate-300 hover:text-primary'
                            }`}
                        >
                          <span>{t} Kadencja</span>
                          {term === t ? (
                            <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">WYBIERZ</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4" />
                <input
                  type="text"
                  placeholder="Szukaj (Enter)..."
                  className="bg-surface border border-border-base rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all w-64 text-primary placeholder:text-secondary opacity-80"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      handleSearchNavigation(navigate, target.value);
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
            {loading ? <Skeleton className="bg-surface border border-border-base rounded-[2rem] h-full min-h-[160px]" /> : (
              <Link to="/glosowania" className="bg-surface border border-border-base rounded-[2rem] p-8 flex items-center gap-5 hover:bg-black/5 dark:hover:bg-white/5 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-0.5">Ostatnie Posiedzenie</p>
                  <h4 className="text-xl font-black text-primary">{stats.lastSittingDate}</h4>
                </div>
              </Link>
            )}

            {/* Trending -> /kategorie */}
            {loading ? <Skeleton className="bg-surface border border-border-base rounded-[2rem] h-full min-h-[160px]" /> : (
              <Link to="/kategorie" className="bg-surface border border-border-base rounded-[2rem] p-8 flex items-center gap-5 hover:bg-black/5 dark:hover:bg-white/5 transition-all group shadow-sm">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-0.5">Na topie</p>
                  <h4 className="text-xl font-black leading-tight text-primary">{stats.trendingTopic}</h4>
                </div>
              </Link>
            )}
          </div>


          {/* Weekly / Sitting Summary */}
          <SittingSummaryCard />

          {/* Main Grid: Hemicycle + Activity + QuickStats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Left Large Card: Plenary Hall */}
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <div className="lg:col-span-3 bg-surface border border-border-base rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group shadow-sm">
                {/* Background Blur decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent-blue/10 dark:bg-accent-blue/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="flex items-center justify-between mb-12 relative z-10">
                  <div>
                    <h2 className="text-3xl font-black text-primary m-0">Sala Plenarna</h2>
                    <p className="text-secondary dark:text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Rozkład głosów (Kadencja {term})</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('vote')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${viewMode === 'vote' ? 'bg-black/5 dark:bg-white/20 border-border-base text-primary' : 'bg-transparent border-border-base hover:bg-black/5 dark:hover:bg-white/10 text-secondary'}`}
                    >
                      Głosowanie
                    </button>
                    <button
                      onClick={() => setViewMode('party')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${viewMode === 'party' ? 'bg-black/5 dark:bg-white/20 border-border-base text-primary' : 'bg-transparent border-border-base hover:bg-black/5 dark:hover:bg-white/10 text-secondary'}`}
                    >
                      Partie
                    </button>
                  </div>
                </div>

                <div className="relative min-h-[400px] flex items-center justify-center">
                  <SejmHemicycle
                    mode={viewMode}
                    data={topVote?.results?.map((r: any) => ({
                      id: r.mps?.id || r.mp_id,
                      name: r.mps?.first_name || 'Nieznany',
                      party: r.mps?.club || 'Niezrzeszony',
                      photo_url: r.mps?.photo_url || '',
                      vote: r.vote,
                      seat_number: r.mps?.seat_number
                    })) || []}
                  />
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
      )}

    </div >
  );
}
