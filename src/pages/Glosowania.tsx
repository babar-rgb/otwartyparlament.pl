import { useState, useMemo } from 'react';
import { votes } from '../data/mockData';
import VoteCard from '../components/VoteCard';
import { Search, Filter, Calendar } from 'lucide-react';

export default function Glosowania() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minImportance, setMinImportance] = useState(0);
  const [result, setResult] = useState<string>('');

  const categories = Array.from(new Set(votes.map((v) => v.category)));

  const filtered = useMemo(() => {
    let result = votes;

    if (searchTerm) {
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      result = result.filter((v) => v.category === selectedCategory);
    }

    if (minImportance > 0) {
      result = result.filter((v) => v.importance >= minImportance);
    }

    if (result) {
      result = result.filter((v) => v.result === result || result === '');
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchTerm, selectedCategory, minImportance, result]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Głosowania sejmowe</h1>
        <p className="text-slate-600">
          Przeszukaj {votes.length}+ głosowań z ostatnich dwóch kadencji. Filtruj po temacie, ważności i wyniku.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Search size={16} className="inline mr-2" />
              Szukaj głosowania
            </label>
            <input
              type="text"
              placeholder="Tytuł, opis lub numer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Filter size={16} className="inline mr-2" />
                Kategoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie kategorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Minimalna ważność
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={minImportance}
                onChange={(e) => setMinImportance(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">{minImportance}%</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wynik
              </label>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Wszystkie wyniki</option>
                <option value="przyjęto">Przyjęto</option>
                <option value="odrzucono">Odrzucono</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Typ
              </label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Wszystkie typy</option>
                <option>Ustawa</option>
                <option>Uchwała</option>
                <option>Apelacja</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            {filtered.length} z {votes.length} głosowań
          </p>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vote) => (
            <VoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg">Nie znaleziono głosowań spełniających kryteria.</p>
        </div>
      )}
    </div>
  );
}
