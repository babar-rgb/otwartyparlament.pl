import { useState, useMemo } from 'react';
import { mps, parties } from '../data/mockData';
import MpCard from '../components/MpCard';
import { Search, Filter } from 'lucide-react';

export default function Poslowie() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'activity' | 'votes'>('name');

  const filtered = useMemo(() => {
    let result = mps;

    if (searchTerm) {
      result = result.filter(
        (mp) =>
          `${mp.imie} ${mp.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mp.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedParty) {
      result = result.filter((mp) => mp.party === selectedParty);
    }

    if (sortBy === 'activity') {
      result.sort((a, b) => b.aktywnosc - a.aktywnosc);
    } else if (sortBy === 'votes') {
      result.sort((a, b) => b.votesCount - a.votesCount);
    } else {
      result.sort((a, b) => `${a.nazwisko}`.localeCompare(b.nazwisko));
    }

    return result;
  }, [searchTerm, selectedParty, sortBy]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Posłowie</h1>
        <p className="text-slate-600">
          Przeszukaj profile {mps.length} posłów i sprawdź ich głosowania, projekty ustaw i aktywność.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Search size={16} className="inline mr-2" />
              Szukaj posła
            </label>
            <input
              type="text"
              placeholder="Imię, nazwisko lub okręg..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Filter size={16} className="inline mr-2" />
              Partia
            </label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Wszystkie partie</option>
              {parties.map((party) => (
                <option key={party.id} value={party.shortName}>
                  {party.shortName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sortuj
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'activity' | 'votes')}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Nazwisko</option>
              <option value="activity">Aktywność</option>
              <option value="votes">Głosów</option>
            </select>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {filtered.length} z {mps.length} posłów
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
  );
}
