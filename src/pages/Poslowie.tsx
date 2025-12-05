import { useState, useMemo, useEffect, useRef } from 'react';
// Force HMR update 10
import { useSearchParams } from 'react-router-dom';
import { MP } from '../api';
import { supabase } from '../lib/supabase';
import { useTerm } from '../context/TermContext';
import TermSwitcher from '../components/TermSwitcher';
import MpCard from '../components/MpCard';
import FeaturedMPs from '../components/FeaturedMPs';
import { Search } from 'lucide-react';

// Fallback mock data for when API fails
const fallbackMPs: MP[] = [
  { id: 101, first_name: 'Anna', last_name: 'Kowalska', club: 'KO', district: 'Warszawa I', photo_url: '', attendanceRate: 98, active: true },
  { id: 102, first_name: 'Jan', last_name: 'Nowak', club: 'PiS', district: 'Kraków I', photo_url: '', attendanceRate: 95, active: true },
  { id: 103, first_name: 'Maria', last_name: 'Wiśniewska', club: 'Trzecia Droga', district: 'Gdańsk', photo_url: '', attendanceRate: 92, active: true },
  { id: 104, first_name: 'Piotr', last_name: 'Lewandowski', club: 'Lewica', district: 'Wrocław', photo_url: '', attendanceRate: 89, active: true },
  { id: 105, first_name: 'Krzysztof', last_name: 'Zieliński', club: 'Konfederacja', district: 'Poznań', photo_url: '', attendanceRate: 91, active: true },
  { id: 106, first_name: 'Magdalena', last_name: 'Dąbrowska', club: 'KO', district: 'Łódź', photo_url: '', attendanceRate: 97, active: true },
  { id: 107, first_name: 'Tomasz', last_name: 'Kamiński', club: 'PiS', district: 'Lublin', photo_url: '', attendanceRate: 93, active: true },
  { id: 108, first_name: 'Agnieszka', last_name: 'Szymańska', club: 'Trzecia Droga', district: 'Szczecin', photo_url: '', attendanceRate: 88, active: true },
  { id: 109, first_name: 'Michał', last_name: 'Woźniak', club: 'Lewica', district: 'Katowice', photo_url: '', attendanceRate: 94, active: true },
  { id: 110, first_name: 'Katarzyna', last_name: 'Kozłowska', club: 'Konfederacja', district: 'Białystok', photo_url: '', attendanceRate: 90, active: true },
  { id: 111, first_name: 'Paweł', last_name: 'Jankowski', club: 'KO', district: 'Toruń', photo_url: '', attendanceRate: 96, active: true },
  { id: 112, first_name: 'Barbara', last_name: 'Mazur', club: 'PiS', district: 'Rzeszów', photo_url: '', attendanceRate: 92, active: true },
  { id: 113, first_name: 'Andrzej', last_name: 'Krawczyk', club: 'Trzecia Droga', district: 'Olsztyn', photo_url: '', attendanceRate: 87, active: true },
  { id: 114, first_name: 'Ewa', last_name: 'Piotrowska', club: 'Lewica', district: 'Zielona Góra', photo_url: '', attendanceRate: 95, active: true },
  { id: 115, first_name: 'Marcin', last_name: 'Grabowski', club: 'Konfederacja', district: 'Kielce', photo_url: '', attendanceRate: 89, active: true },
  { id: 116, first_name: 'Joanna', last_name: 'Pawlak', club: 'KO', district: 'Opole', photo_url: '', attendanceRate: 98, active: true },
];

// Major clubs to exclude from "INNE" filter
const MAJOR_CLUBS = ['KO', 'PiS', 'Polska2050', 'PSL-TD', 'Lewica', 'Konfederacja'];

// Mapping from UI names to actual API club names
const MIN_PARTY_MAP: Record<string, string> = {
  'RAZEM': 'Razem',
  'REPUBLIKANIE': 'Republikanie',
  'KONFEDERACJA KP': 'Konfederacja_KP',
  'NIEZALEŻNI': 'niez.',
};

// Helper for Party Colors (Same as Europarlament)
const getPartyColor = (party: string) => {
  const p = party?.toLowerCase() || '';

  if (p.includes('ko') || p.includes('koalicja obywatelska') || p.includes('po') || p.includes('nowoczesna') || p.includes('inicjatywa polska'))
    return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-transparent shadow-md'; // KO

  if (p.includes('pis') || p.includes('prawo i sprawiedliwość') || p.includes('suwerenna polska'))
    return 'bg-gradient-to-r from-blue-700 to-blue-900 text-white border-transparent shadow-md'; // PiS

  if (p.includes('polska 2050') || p.includes('trzecia droga (polska 2050)'))
    return 'bg-yellow-400 text-black border-transparent shadow-md'; // PL2050: Yellow + Black text

  if (p.includes('psl') || p.includes('trzecia droga (psl)'))
    return 'bg-gradient-to-r from-green-600 to-emerald-700 text-white border-transparent shadow-md'; // PSL

  if (p.includes('konfederacja'))
    return 'bg-gradient-to-r from-[#091F42] to-[#0f284d] text-white border-transparent shadow-md'; // Konfederacja (Dark Navy)

  if (p.includes('lewica') || p.includes('razem'))
    return 'bg-gradient-to-r from-purple-600 to-red-600 text-white border-transparent shadow-md'; // Lewica

  if (p.includes('kukiz'))
    return 'bg-gray-700 text-white border-transparent';

  return 'bg-white text-ink border-gray-200 hover:border-brand dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:border-brand';
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
  // ... (rest of state items same)
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [isInnePopoverOpen, setIsInnePopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync search term with URL query param
  useEffect(() => {
    const query = searchParams.get('q');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadMps = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mps')
          .select('*')
          .eq('term', term) // Filter by selected Term
          .eq('active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        console.log(`Fetched MPs for Term ${term}: `, data?.length);

        // Map DB columns to MP interface
        const mappedMps: MP[] = (data || []).map(mp => ({
          id: mp.id,
          first_name: mp.name.split(' ')[0],
          last_name: mp.name.split(' ').slice(1).join(' '),
          club: mp.party,
          district: mp.district,
          photo_url: mp.photo_url,
          attendanceRate: Math.round(mp.stats_attendance || 0),
          active: mp.active,
          rebelVotes: mp.stats_rebellion || 0
        }));

        setMps(mappedMps);
      } catch (error) {
        console.error('Error fetching MPs:', error);
        if (term === 10) setMps(fallbackMPs);
        else setMps([]);
      } finally {
        setLoading(false);
      }
    };
    loadMps();
  }, [term]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsInnePopoverOpen(false);
      }
    };

    if (isInnePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isInnePopoverOpen]);

  const filtered = useMemo(() => {
    let result = mps;

    if (searchTerm) {
      // ... (same search logic)
      result = result.filter((mp) =>
        `${mp.first_name} ${mp.last_name} `.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedParty) {
      if (selectedParty === 'INNE') {
        result = result.filter((mp) => !MAJOR_CLUBS.includes(mp.club));
      } else if (MIN_PARTY_MAP[selectedParty]) {
        const fullClubName = MIN_PARTY_MAP[selectedParty];
        result = result.filter((mp) => mp.club === fullClubName);
      } else {
        result = result.filter((mp) => mp.club === selectedParty);
      }
    }

    return result;
  }, [searchTerm, selectedParty, mps]);

  // ... (featuredMPs logic same)
  // Create featured MPs subsets
  const featuredMPs = useMemo(() => {
    const sorted = [...mps];
    return {
      topAttendance: sorted
        .sort((a, b) => (b.attendanceRate || 0) - (a.attendanceRate || 0))
        .slice(0, 5),
      topRebels: sorted
        .sort((a, b) => (b.rebelVotes || 0) - (a.rebelVotes || 0))
        .slice(0, 5),
      lowAttendance: sorted
        .sort((a, b) => (a.attendanceRate || 0) - (b.attendanceRate || 0))
        .slice(0, 5),
    };
  }, [mps]);

  if (loading) return <div className="text-center py-12">Ładowanie danych z Sejmu...</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-7xl">

      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-ink dark:text-white mb-4 tracking-tight">
            Nasi Reprezentanci
          </h1>
          <p className="text-xl text-ink-light dark:text-slate-400">
            {mps.length} posłów. Znajdź i weryfikuj.
          </p>
        </div>
        <TermSwitcher />
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={24} />
          <input
            type="text"
            placeholder="Wyszukaj nazwisko posła..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Party Filter Buttons */}
      <div className="mb-12">
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setSelectedParty('')}
            className={`px-6 py-3 rounded-full font-bold transition-all border ${selectedParty === ''
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-[#24243e] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-indigo-800 hover:border-blue-300'
              } `}
          >
            Wszyscy {selectedParty === '' && <span className="text-sm ml-1">({mps.length})</span>}
          </button>

          {PARTIES.map((party) => (
            <button
              key={party.id}
              onClick={() => setSelectedParty(party.id)}
              className={`px-6 py-3 rounded-full font-bold transition-all border ${selectedParty === party.id
                ? getPartyColor(party.name)
                : 'bg-white dark:bg-[#24243e] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-indigo-800 hover:border-blue-300'
                }`}
            >
              {party.name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured MPs Dashboard - Only show when no filters active */}
      {!searchTerm && !selectedParty && (
        <FeaturedMPs
          topAttendance={featuredMPs.topAttendance}
          topRebels={featuredMPs.topRebels}
          lowAttendance={featuredMPs.lowAttendance}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filtered.map((mp) => (
          <MpCard key={mp.id} mp={mp} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-ink-light dark:text-slate-400">
          Nie znaleziono posłów spełniających kryteria.
        </div>
      )}
    </div>
  );
}
