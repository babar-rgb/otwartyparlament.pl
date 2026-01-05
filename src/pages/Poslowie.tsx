import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MP, fetchMPs } from '../api';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/ui/TermSwitcher';
import MpCard from '../components/features/sejm/MpCard';
import FeaturedMPs from '../components/FeaturedMPs';
import { Search, Sparkles, Filter as FilterIcon, X } from 'lucide-react';
import SEO from '../components/SEO';

const MAJOR_CLUBS = ['KO', 'PiS', 'Polska2050', 'PSL-TD', 'Lewica', 'Konfederacja'];
const MIN_PARTY_MAP: Record<string, string> = {
  'RAZEM': 'Razem',
  'REPUBLIKANIE': 'Republikanie',
  'KONFEDERACJA KP': 'Konfederacja_KP',
  'NIEZALEŻNI': 'niez.',
};

const PARTIES = [
  { id: 'KO', name: 'Koalicja Obywatelska' },
  { id: 'PiS', name: 'Prawo i Sprawiedliwość' },
  { id: 'Polska2050', name: 'Polska 2050' },
  { id: 'PSL-TD', name: 'PSL' },
  { id: 'Lewica', name: 'Lewica' },
  { id: 'Konfederacja', name: 'Konfederacja' },
  { id: 'INNE', name: 'INNE' },
];

export default function Poslowie() {
  const [searchParams] = useSearchParams();
  const { term } = useTerm();
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedParty, setSelectedParty] = useState<string>('');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query !== null) setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const loadMps = async () => {
      setLoading(true);
      try {
        const data = await fetchMPs({
          term,
          active: term === 10 ? true : undefined,
          limit: 1000
        });
        setMps(data);
      } catch (error: any) {
        console.error('Error fetching MPs:', error);
        setMps([]);
      } finally {
        setLoading(false);
      }
    };
    loadMps();
  }, [term]);

  const filtered = useMemo(() => {
    let result = mps;
    if (searchTerm) {
      result = result.filter((mp) =>
        `${mp.first_name} ${mp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedParty) {
      if (selectedParty === 'INNE') {
        result = result.filter((mp) => !MAJOR_CLUBS.includes(mp.club));
      } else {
        result = result.filter((mp) => mp.club === (MIN_PARTY_MAP[selectedParty] || selectedParty));
      }
    }
    return result;
  }, [searchTerm, selectedParty, mps]);

  const featuredMPs = useMemo(() => {
    const sorted = [...mps];
    return {
      topAttendance: sorted.sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0)).slice(0, 5),
      topRebels: sorted.sort((a, b) => (b.rebelVotes || 0) - (a.rebelVotes || 0)).slice(0, 5),
      lowAttendance: sorted.sort((a, b) => (a.attendanceRate || 0) - (b.attendanceRate || 0)).slice(0, 5),
    };
  }, [mps]);

  if (loading) return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-accent-blue/20 border-t-accent-blue rounded-full animate-spin"></div>
        <div className="text-secondary text-xs font-black uppercase tracking-widest">Weryfikacja składu Izby...</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page transition-colors duration-500 pb-24">
      <SEO
        title="Posłowie RP"
        description="Baza danych posłów X kadencji Sejmu. Statystyki, obecność, przynależność partyjna."
      />

      {/* Hero Section */}
      <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden dashboard-mesh border-b border-border-base">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest mb-4">
                <Sparkles size={12} />
                Legislative Database v1.0
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                Nasi <span className="italic font-serif opacity-60">Reprezentanci</span>
              </h1>
              <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                Wykaz {mps.length} posłów sprawujących mandat w {term}. kadencji. Monitoruj ich aktywność i weryfikuj obietnice.
              </p>
            </div>
            <TermSwitcher />
          </div>

          {/* Search Bar - Integrated in Hero */}
          <div className="mt-12 relative max-w-2xl">
            <div className="absolute inset-0 bg-accent-blue/5 blur-3xl rounded-full opacity-50"></div>
            <div className="relative flex items-center bg-surface border border-border-base p-1.5 rounded-2xl shadow-xl backdrop-blur-xl group focus-within:border-accent-blue/50 transition-all">
              <Search className="ml-4 text-secondary group-focus-within:text-accent-blue transition-colors" size={20} />
              <input
                type="text"
                placeholder="Szukaj po nazwisku..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none py-3 px-4 text-primary placeholder:text-secondary/40 focus:ring-0 font-bold"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-2 text-secondary hover:text-primary">
                  <X size={18} />
                </button>
              )}
              <div className="h-8 w-px bg-border-base mx-2"></div>
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest text-secondary transition-colors">
                <FilterIcon size={16} />
                <span className="hidden sm:inline">Filtry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 space-y-16">
        {/* Party Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedParty('')}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedParty === ''
              ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20 border-accent-blue'
              : 'bg-surface text-secondary border-border-base hover:border-accent-blue/50 dark:hover:border-accent-blue/50 hover:text-primary'
              }`}
          >
            Wszyscy ({mps.length})
          </button>

          {PARTIES.map((party) => (
            <button
              key={party.id}
              onClick={() => setSelectedParty(party.id)}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${selectedParty === party.id
                ? 'bg-accent-blue text-white shadow-lg shadow-accent-blue/20 border-accent-blue'
                : 'bg-surface text-secondary border-border-base hover:border-accent-blue/50 dark:hover:border-accent-blue/50 hover:text-primary'
                }`}
            >
              {party.name}
            </button>
          ))}
        </div>

        {/* Featured Dashboard */}
        {!searchTerm && !selectedParty && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <FeaturedMPs
              topAttendance={featuredMPs.topAttendance}
              topRebels={featuredMPs.topRebels}
              lowAttendance={featuredMPs.lowAttendance}
            />
          </div>
        )}

        {/* Main Grid - Tiled aesthetic with smaller units */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border-base pb-4">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-secondary">Skład Izby</h2>
            <div className="text-[10px] font-black uppercase text-secondary/40">{filtered.length} wyników</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-5">
            {filtered.map((mp) => (
              <MpCard key={mp.id} mp={mp} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24 bg-surface rounded-[3rem] border border-border-base border-dashed">
              <p className="text-secondary font-medium italic">Nie znaleziono posłów spełniających kryteria wyszukiwania.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
