import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/ui/TermSwitcher';
import MpCard from '../components/features/sejm/MpCard';
import { Search, X } from 'lucide-react';
import SEO from '../components/SEO';
import { useMPs } from '../hooks/useMPs';

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

let lastScrollY = 0;

export default function Poslowie() {
  const [searchParams] = useSearchParams();
  const { term } = useTerm();
  const { data: mps = [], isLoading: loading } = useMPs(term);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedParty, setSelectedParty] = useState<string>('');

  // Handle scroll restoration
  useEffect(() => {
    if (mps.length > 0) {
      const timeout = setTimeout(() => {
        window.scrollTo(0, lastScrollY);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [mps.length]);

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

  const normalizePl = (str: string) => {
    return str.toLowerCase()
      .replace(/ą/g, 'a')
      .replace(/ć/g, 'c')
      .replace(/ę/g, 'e')
      .replace(/ł/g, 'l')
      .replace(/ń/g, 'n')
      .replace(/ó/g, 'o')
      .replace(/ś/g, 's')
      .replace(/ź/g, 'z')
      .replace(/ż/g, 'z');
  };

  const filtered = useMemo(() => {
    let result = mps;
    if (searchTerm) {
      const normalizedSearch = normalizePl(searchTerm);
      result = result.filter((mp) => {
        const fullName = [mp.first_name, mp.last_name].filter(Boolean).join(' ');
        return normalizePl(fullName).includes(normalizedSearch);
      });
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
    <>
      <SEO
        title="Posłowie Sejmu X Kadencji - Pełna Lista"
        description="Przeglądaj profile wszystkim 460 posłów Sejmu RP. Sprawdź ich frekwencję, statystyki głosowań, przynależność klubową oraz aktywność legislacyjną."
      />
      <div className="min-h-screen bg-page transition-colors duration-500 pb-24">
        <SEO
          title={`Posłowie Sejmu ${term}. Kadencji`}
          description={`Pełna baza ${mps.length} posłów Sejmu RP ${term}. kadencji. Sprawdź statystyki głosowań, frekwencję, interpelacje i aktywność parlamentarną.`}
          url="/poslowie"
        />

        {/* Hero Section */}
        <div className="pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-border-base">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>

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

        <div className="container mx-auto max-w-screen-2xl px-4 md:px-8 pt-12 space-y-16">
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
                      className="w-full bg-transparent text-xl font-bold text-primary placeholder:text-slate-400 focus:outline-none"
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
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                    : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white hover:text-primary transition-colors'
                    }`}
                >
                  Wszyscy ({mps.length})
                </button>

                {PARTIES.map((party) => (
                  <button
                    key={party.id}
                    onClick={() => setSelectedParty(party.id)}
                    className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider whitespace-nowrap transition-all border ${selectedParty === party.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                      : 'bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white hover:text-primary transition-colors'
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-8 gap-6">
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
    </>
  );
}
