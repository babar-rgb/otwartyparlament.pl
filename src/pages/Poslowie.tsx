import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MP, fetchMPs } from '../api';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/ui/TermSwitcher';
import MpCard from '../components/features/sejm/MpCard';
import { Search, Sparkles, X } from 'lucide-react';
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

// Module-level cache to persist order during navigation without re-fetching/re-shuffling
let mpsCache: MP[] = [];
let lastTerm: number | null = null;
let lastScrollY = 0;

export default function Poslowie() {
  const [searchParams] = useSearchParams();
  const { term } = useTerm();
  const [mps, setMps] = useState<MP[]>(mpsCache);
  const [loading, setLoading] = useState(mpsCache.length === 0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedParty, setSelectedParty] = useState<string>('');

  // Handle scroll restoration
  useEffect(() => {
    if (mpsCache.length > 0) {
      // Small timeout to ensure the grid has rendered before scrolling
      const timeout = setTimeout(() => {
        window.scrollTo(0, lastScrollY);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, []);

  // Save scroll position when leaving
  useEffect(() => {
    const handleScroll = () => {
      lastScrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query !== null) setSearchTerm(query);
  }, [searchParams]);

  useEffect(() => {
    const loadMps = async () => {
      // If we have cache for the same term, don't re-fetch
      if (mpsCache.length > 0 && lastTerm === term) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchMPs({
          term,
          active: term === 10 ? true : undefined,
          limit: 1000
        });

        // Client-side shuffle (Fisher-Yates) 
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        mpsCache = shuffled;
        lastTerm = term;
        setMps(shuffled);
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
        [mp.first_name, mp.last_name].filter(Boolean).join(' ').toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-blue/10 text-accent-blue rounded-full border border-accent-blue/20 text-[10px] font-black uppercase tracking-widest mb-4">
                <Sparkles size={12} />
                Legislative Database v1.0
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-primary mb-4 tracking-tighter">
                Nasi <span className="italic font-serif text-accent-blue/80">Reprezentanci</span>
              </h1>
              <p className="text-secondary text-lg font-medium max-w-xl leading-relaxed">
                Wykaz {mps.length} posłów sprawujących mandat w {term}. kadencji. Monitoruj ich aktywność i weryfikuj obietnice.
              </p>
            </div>
            <TermSwitcher />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 space-y-16">
        {/* Filter & Search Section - Unified Style */}
        <div className="bg-surface p-6 rounded-[2rem] border border-border-base shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative flex-1">
                <div className="relative flex items-center gap-4">
                  <Search className="text-secondary transition-colors" size={24} />
                  <input
                    type="text"
                    placeholder="Szukaj posła (imię, nazwisko)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-secondary/30 focus:outline-none"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="p-2 text-secondary hover:text-primary transition-colors">
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Party Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 border-t border-border-base/10 pt-6">
              <button
                onClick={() => setSelectedParty('')}
                className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${selectedParty === ''
                  ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                  : 'bg-page text-secondary border-border-base hover:bg-surface hover:text-primary'
                  }`}
              >
                Wszyscy ({mps.length})
              </button>

              {PARTIES.map((party) => (
                <button
                  key={party.id}
                  onClick={() => setSelectedParty(party.id)}
                  className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${selectedParty === party.id
                    ? 'bg-accent-blue text-white border-accent-blue shadow-lg shadow-accent-blue/20'
                    : 'bg-page text-secondary border-border-base hover:bg-surface hover:text-primary'
                    }`}
                >
                  {party.name}
                </button>
              ))}
            </div>
          </div>
        </div>



        {/* Main Grid - Tiled aesthetic with smaller units */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-border-base pb-4">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-secondary">Skład Izby</h2>
            <div className="text-[10px] font-black uppercase text-secondary/40">{filtered.length} wyników</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
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
