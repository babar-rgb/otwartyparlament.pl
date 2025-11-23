import { useState, useMemo, useEffect } from 'react';
import { fetchMPs, MP } from '../api';
import MpCard from '../components/MpCard';
import { Search } from 'lucide-react';

// Mock data for visualization
const mockMPs: MP[] = [
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

const parties = [
  { id: 'KO', name: 'KO', color: '#FF6B00' },
  { id: 'PiS', name: 'PiS', color: '#1E3A8A' },
  { id: 'Trzecia Droga', name: 'Trzecia Droga', color: '#16A34A' },
  { id: 'Lewica', name: 'Lewica', color: '#DC2626' },
  { id: 'Konfederacja', name: 'Konfederacja', color: '#7F1D1D' },
];

export default function Poslowie() {
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('');

  useEffect(() => {
    const loadMps = async () => {
      try {
        const data = await fetchMPs();
        // Combine API data with mock data
        const combinedData = data.length > 0 ? data : mockMPs;
        setMps(combinedData);
      } catch (error) {
        console.error('Error fetching MPs:', error);
        // Use mock data on error
        setMps(mockMPs);
      } finally {
        setLoading(false);
      }
    };
    loadMps();
  }, []);

  const filtered = useMemo(() => {
    let result = mps;

    if (searchTerm) {
      result = result.filter((mp) =>
        `${mp.first_name} ${mp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedParty) {
      result = result.filter((mp) => mp.club === selectedParty);
    }

    return result;
  }, [searchTerm, selectedParty, mps]);

  if (loading) return <div className="text-center py-12">Ładowanie posłów...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-black mb-4 tracking-tight">
            Nasi Reprezentanci
          </h1>
          <p className="text-xl text-slate-600">
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
              className="w-full pl-14 pr-6 py-4 text-lg border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition"
            />
          </div>
        </div>

        {/* Party Filter Pills */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {parties.map((party) => (
            <button
              key={party.id}
              onClick={() => setSelectedParty(selectedParty === party.id ? '' : party.id)}
              className={`px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wide transition-all duration-200 ${selectedParty === party.id
                ? 'text-white shadow-lg scale-105'
                : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-400'
                }`}
              style={
                selectedParty === party.id
                  ? { backgroundColor: party.color }
                  : {}
              }
            >
              {party.name}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="mb-6 text-center">
          <p className="text-slate-600">
            {filtered.length} {filtered.length === 1 ? 'poseł' : filtered.length < 5 ? 'posłów' : 'posłów'}
            {selectedParty && ` w ${selectedParty}`}
          </p>
        </div>

        {/* MP Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filtered.map((mp) => (
              <MpCard key={mp.id} mp={mp} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg">Nie znaleziono posłów spełniających kryteria wyszukiwania.</p>
          </div>
        )}
      </div>
    </div>
  );
}
