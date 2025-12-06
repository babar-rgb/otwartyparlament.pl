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

// Fallback mock data removed for production safety
// const fallbackMPs: MP[] = [];

// Major clubs to exclude from "INNE" filter
const MAJOR_CLUBS = ['KO', 'PiS', 'Polska2050', 'PSL-TD', 'Lewica', 'Konfederacja'];

// Mapping from UI names to actual API club names
const MIN_PARTY_MAP: Record<string, string> = {
  'RAZEM': 'Razem',
  'REPUBLIKANIE': 'Republikanie',
  'KONFEDERACJA KP': 'Konfederacja_KP',
  'NIEZALEŻNI': 'niez.',
};

import { getPartyStyle } from '../utils/theme';

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
          rebelVotes: mp.stats_rebellion || 0,
          slug: mp.slug,
          term: mp.term
        }));
        setMps(mappedMps);
      } catch (error) {
        console.error('Error fetching MPs:', error);
        setMps([]);
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
                ? getPartyStyle(party.name)
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
