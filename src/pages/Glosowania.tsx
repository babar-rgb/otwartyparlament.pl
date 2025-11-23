import { useState, useMemo, useEffect } from 'react';
import { fetchVotes, Vote } from '../api';
import VoteCard from '../components/VoteCard';
import { Search, Filter, Calendar } from 'lucide-react';

export default function Glosowania() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [minImportance, setMinImportance] = useState(0);
  const [resultFilter, setResultFilter] = useState<string>('');

  useEffect(() => {
    const loadVotes = async () => {
      try {
        const data = await fetchVotes();
        setVotes(data);
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadVotes();
  }, []);

  const categories = Array.from(new Set(votes.map((v) => v.topic).filter(Boolean) as string[]));

  const filtered = useMemo(() => {
    let result = votes;

    if (searchTerm) {
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.description && v.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      result = result.filter((v) => v.topic === selectedCategory);
    }

    if (minImportance > 0) {
      result = result.filter((v) => v.importance >= minImportance);
    }

    // Result filter logic would need real result data
    // if (resultFilter) { ... }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchTerm, selectedCategory, minImportance, resultFilter, votes]);

  if (loading) return <div className="text-center py-12">Ładowanie głosowań...</div>;

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
                max="10"
                value={minImportance}
                onChange={(e) => setMinImportance(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">{minImportance}/10</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Wynik
              </label>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
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
