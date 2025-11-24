import { useState, useMemo, useEffect, useRef } from 'react';
import { MP } from '../api';
import { supabase } from '../lib/supabase';
import MpCard from '../components/MpCard';
import FeaturedMPs from '../components/FeaturedMPs';
import { Search, ChevronDown } from 'lucide-react';

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

// Minor parties for INNE submenu
const MINOR_PARTIES = [
  { id: 'RAZEM', name: 'Razem' },
  { id: 'REPUBLIKANIE', name: 'Republikanie' },
  { id: 'KONFEDERACJA KP', name: 'Konfederacja KP' },
  { id: 'NIEZALEŻNI', name: 'Niezależni' },
];

// Mapping from UI names to actual API club names
const MIN_PARTY_MAP: Record<string, string> = {
  'RAZEM': 'Razem',
  'REPUBLIKANIE': 'Republikanie',
  'KONFEDERACJA KP': 'Konfederacja_KP',
  'NIEZALEŻNI': 'niez.',
};

const parties = [
  { id: 'KO', name: 'KO', color: '#0096FF' },
  { id: 'PiS', name: 'PiS', color: '#800000' },
  { id: 'Polska2050', name: 'Polska2050', color: '#00A150' },
  { id: 'PSL-TD', name: 'PSL-TD', color: '#90EE90' },
  { id: 'Lewica', name: 'Lewica', color: '#FF0000' },
  { id: 'Konfederacja', name: 'Konfederacja', color: '#000080' },
  { id: 'INNE', name: 'INNE', color: '#1F2937' },
];

export default function Poslowie() {
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [isInnePopoverOpen, setIsInnePopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMps = async () => {
      try {
        const { data, error } = await supabase
          .from('mps')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true });

        if (error) throw error;

        console.log('Fetched MPs from Supabase:', data);

        // Map DB columns to MP interface
        const mappedMps: MP[] = (data || []).map(mp => ({
          id: mp.id,
          first_name: mp.name.split(' ')[0], // Simple split, or use a better heuristic if needed
          last_name: mp.name.split(' ').slice(1).join(' '),
          club: mp.party,
          district: mp.district,
          photo_url: mp.photo_url,
          attendanceRate: Math.round(mp.stats_attendance || 0), // Ensure integer
          active: mp.active,
          rebelVotes: mp.stats_rebellion || 0
        }));

        setMps(mappedMps);
      } catch (error) {
        console.error('Error fetching MPs:', error);
        setMps(fallbackMPs);
      } finally {
        setLoading(false);
      }
    };
    loadMps();
  }, []);

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
      result = result.filter((mp) =>
        `${mp.first_name} ${mp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedParty) {
      if (selectedParty === 'INNE') {
        // Show MPs from minor clubs (exclude major clubs)
        result = result.filter((mp) => !MAJOR_CLUBS.includes(mp.club));
      } else if (MIN_PARTY_MAP[selectedParty]) {
        // Map UI name to full DB club name for minor parties
        const fullClubName = MIN_PARTY_MAP[selectedParty];
        result = result.filter((mp) => mp.club === fullClubName);
      } else {
        // Show MPs from the selected major club (direct match)
        result = result.filter((mp) => mp.club === selectedParty);
      }
    }

    return result;
  }, [searchTerm, selectedParty, mps]);

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
    <div className="min-h-screen bg-paper py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-ink mb-4 tracking-tight">
            Nasi Reprezentanci
          </h1>
          <p className="text-xl text-ink-light">
            {mps.length} posłów. Znajdź i weryfikuj.
          </p>
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
              className="w-full pl-14 pr-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition bg-white"
            />
          </div>
        </div>

        {/* Party Filter Buttons */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedParty('')}
              className={`px-6 py-3 rounded-xl font-bold transition border-2 ${selectedParty === ''
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink border-gray-200 hover:border-brand'
                }`}
            >
              Wszyscy {selectedParty === '' && <span className="text-sm ml-1">({mps.length})</span>}
            </button>
            {parties.map((party) => {
              // Special handling for INNE button with popover
              if (party.id === 'INNE') {
                return (
                  <div key={party.id} className="relative" ref={popoverRef}>
                    <button
                      onClick={() => {
                        if (selectedParty === 'INNE') {
                          setSelectedParty('');
                          setIsInnePopoverOpen(false);
                        } else {
                          setSelectedParty('INNE');
                          setIsInnePopoverOpen(!isInnePopoverOpen);
                        }
                      }}
                      className={`px-6 py-3 rounded-xl font-bold transition border-2 flex items-center gap-2 ${selectedParty === 'INNE'
                        ? 'text-white border-transparent'
                        : 'bg-white text-ink border-gray-200 hover:border-brand'
                        }`}
                      style={{
                        backgroundColor: selectedParty === 'INNE' ? party.color : undefined,
                      }}
                    >
                      {party.name}
                      {selectedParty === 'INNE' && <span className="text-sm">({filtered.length})</span>}
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isInnePopoverOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Popover Submenu */}
                    {isInnePopoverOpen && (
                      <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-sm py-2 z-50 min-w-[200px] animate-in fade-in duration-75">
                        {MINOR_PARTIES.map((minorParty) => (
                          <button
                            key={minorParty.id}
                            onClick={() => {
                              setSelectedParty(minorParty.id);
                              setIsInnePopoverOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-ink hover:bg-brand/10 transition"
                          >
                            {minorParty.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular party buttons
              return (
                <button
                  key={party.id}
                  onClick={() => {
                    setSelectedParty(party.id);
                    setIsInnePopoverOpen(false);
                  }}
                  className={`px-6 py-3 rounded-xl font-bold transition border-2 ${selectedParty === party.id
                    ? 'text-white border-transparent'
                    : 'bg-white text-ink border-gray-200 hover:border-brand'
                    }`}
                  style={{
                    backgroundColor: selectedParty === party.id ? party.color : undefined,
                  }}
                >
                  {party.name}
                  {selectedParty === party.id && <span className="text-sm ml-1">({filtered.length})</span>}
                </button>
              );
            })}
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
          <div className="text-center py-12 text-ink-light">
            Nie znaleziono posłów spełniających kryteria.
          </div>
        )}
      </div>
    </div>
  );
}
