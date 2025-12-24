import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Search,
  Calendar,
  TrendingUp,
  LayoutDashboard,
  BarChart3,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTerm } from '../context/TermContext';
import SejmHemicycle from '../components/SejmHemicycle';
import { Skeleton, CardSkeleton, ChartSkeleton } from '../components/Skeleton';
import SEO from '../components/SEO';

interface DashboardStats {
  mpsCount: number;
  votesCount: number;
  printsCount: number;
  lastSittingDate: string;
  trendingTopic: string;
}

interface TopVote {
  id: number;
  title: string;
  date: string;
  summary: string;
  ux_category: string;
  results: any[];
}

export default function Home() {
  const { term, setTerm } = useTerm();
  const [termDropdownOpen, setTermDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'vote' | 'party'>('vote');
  const [stats, setStats] = useState<DashboardStats>({
    mpsCount: 460,
    votesCount: 0,
    printsCount: 0,
    lastSittingDate: '---',
    trendingTopic: '---'
  });
  const [topVote, setTopVote] = useState<TopVote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Safety Force Stop
    const maxWait = setTimeout(() => setLoading(false), 4000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setTermDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearTimeout(maxWait);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [term]);

  async function fetchDashboardData() {
    setLoading(true);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 4000)
    );

    try {
      const fetchData = async () => {
        // OPTIMIZED: Select only necessary count, avoid overkill
        const [votesCountReq, printsCountReq, lastVoteReq, topVoteReq] = await Promise.all([
          supabase.from('votes').select('id', { count: 'exact', head: true }).eq('term', term),
          supabase.from('sejm_prints').select('id', { count: 'exact', head: true }),
          supabase.from('votes').select('date, ux_category').eq('term', term).order('date', { ascending: false }).limit(20),
          supabase.from('votes').select(`id, title_clean, date, ux_category, details_json, importance_score`)
            .eq('term', term)
            .order('importance_score', { ascending: false })
            .limit(1)
            .maybeSingle()
        ]);

        // Process Stats
        const lastDate = lastVoteReq.data?.[0]?.date || '---';
        const topics = lastVoteReq.data?.map(v => v.ux_category).filter(Boolean) as string[] || [];
        const mostFrequentTopic = topics.length > 0
          ? topics.sort((a, b) => topics.filter(v => v === a).length - topics.filter(v => v === b).length).pop()
          : 'Legislacja';

        setStats({
          mpsCount: 460,
          votesCount: votesCountReq.count || 0,
          printsCount: printsCountReq.count || 0,
          lastSittingDate: lastDate !== '---' ? new Date(lastDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' }) : 'Brak danych',
          trendingTopic: mostFrequentTopic || 'Legislacja'
        });

        // Process Top Vote
        const topV = topVoteReq.data;
        if (topV) {
          // Optimized: Fetch minimal fields for Hemicycle
          const [resDataReq, analysisReq] = await Promise.all([
            // Limit to 460 to enable fast client-side rendering
            supabase.from('vote_results').select('vote, mp_id').eq('vote_id', topV.id).limit(460),
            supabase.from('vote_analyses').select('summary').eq('vote_id', topV.id).maybeSingle()
          ]);

          let enrichedResults: any[] = [];
          if (resDataReq.data) {
            const mpIds = resDataReq.data.map(r => r.mp_id);
            // Optimized: Only fetch what Hemicycle needs (color + name + photo)
            const { data: mpsData } = await supabase.from('mps').select('id, name, party, seat_number, photo_url').in('id', mpIds);
            const mpsMap = new Map(mpsData?.map(mp => [mp.id, mp]) || []);

            enrichedResults = resDataReq.data.map(r => ({
              ...r,
              mps: mpsMap.get(r.mp_id) || null
            }));
          }

          setTopVote({
            id: topV.id,
            title: topV.title_clean,
            date: topV.date,
            summary: analysisReq.data?.summary || "Trwa analiza treści ustawy przez model AI...",
            ux_category: topV.ux_category || 'Ogólne',
            results: enrichedResults
          });
        }
      };

      await Promise.race([fetchData(), timeoutPromise]);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

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
                          setTerm(t as any);
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
                    window.location.href = `/szukaj?q=${target.value}`;
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Top Row Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Main Status Card -> /rankingi */}
          {loading ? <CardSkeleton /> : (
            <Link to="/rankingi" className="md:col-span-2 relative group overflow-hidden block">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 h-full flex items-center gap-6 relative z-10 transition-transform group-hover:scale-[1.01] shadow-sm">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                  <BarChart3 className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-indigo-500 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">Status Prac</p>
                  <h3 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">Rankingi Aktywności</h3>
                  <p className="text-slate-500 dark:text-white/50 text-sm">Automatyczna analiza aktywności posłów i komisji.</p>
                </div>
                <div className="ml-auto flex -space-x-2">
                  {[
                    { name: 'PiS', abbr: 'PiS', bg: 'bg-blue-700' },
                    { name: 'KO', abbr: 'KO', bg: 'bg-gradient-to-br from-orange-500 to-red-600' },
                    { name: 'Polska 2050', abbr: '2050', bg: 'bg-yellow-400' },
                    { name: 'PSL', abbr: 'PSL', bg: 'bg-green-600' },
                    { name: 'Lewica', abbr: 'L', bg: 'bg-gradient-to-br from-purple-600 to-red-500' },
                  ].map((party) => (
                    <div
                      key={party.name}
                      title={party.name}
                      className={`w-9 h-9 rounded-full border-2 border-white dark:border-[#111126] flex items-center justify-center shadow-lg hover:scale-110 hover:z-10 transition-transform cursor-pointer ${party.bg}`}
                    >
                      <span className={`text-[10px] font-black ${party.name === 'Polska 2050' ? 'text-slate-900' : 'text-white'}`}>
                        {party.abbr}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          )}

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

        {/* Main Grid: Hemicycle + Topic of the Day */}
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

          {/* Right Column: Topic of the Day Card */}
          {loading ? <Skeleton className="h-[600px] rounded-[2.5rem] w-full bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5" /> : (
            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 h-full relative overflow-hidden flex flex-col min-h-[500px] shadow-sm">
                <div className="absolute top-0 right-0 p-8">
                  <p className="text-slate-400 dark:text-white/30 text-xs font-black font-mono">
                    {topVote ? new Date(topVote.date).toISOString().split('T')[0] : '2023-12-15'}
                  </p>
                </div>

                <div className="mt-8 mb-8">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-500/20">
                    TEMAT DNIA
                  </span>
                  <h3 className="text-2xl font-black mt-4 leading-tight text-slate-900 dark:text-white">
                    {topVote?.title || "Wybór Marszałka Sejmu X Kadencji"}
                  </h3>
                </div>

                <div className="flex-grow">
                  <p className="text-slate-600 dark:text-white/60 text-sm leading-relaxed mb-6 italic">
                    "{topVote?.summary || "Najważniejsza decyzja polityczna rozpoczęcia nowej kadencji, definiująca układ sił w parlamencie."}"
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-white/40 font-bold uppercase tracking-widest italic">Analiza AI</span>
                      <span className="text-indigo-500 dark:text-indigo-400 font-bold">100% Complete</span>
                    </div>
                    <div className="h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 w-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    </div>
                  </div>
                </div>

                <Link
                  to={topVote ? `/glosowanie/${topVote.id}` : "/glosowania"}
                  className="mt-12 group flex items-center justify-between p-4 bg-indigo-500 rounded-2xl text-white font-black uppercase tracking-widest text-xs hover:bg-indigo-400 transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)]"
                >
                  Analiza Decyzji
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Tiny quick stats cards below */}
              <div className="grid grid-cols-2 gap-4">
                <Link to="/poslowie" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                  <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mb-1" />
                  <span className="text-lg font-black text-slate-900 dark:text-white">{stats.mpsCount}</span>
                  <span className="text-[8px] text-slate-500 dark:text-white/30 uppercase tracking-widest font-bold">Posłów</span>
                </Link>
                <Link to="/glosowania" className="bg-white dark:bg-[#111126] border border-slate-200 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
                  <FileText className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mb-1" />
                  <span className="text-lg font-black text-slate-900 dark:text-white">{stats.votesCount}</span>
                  <span className="text-[8px] text-slate-500 dark:text-white/30 uppercase tracking-widest font-bold">Głosowań</span>
                </Link>
              </div>
            </div>
          )}
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
    </div>
  );
}
