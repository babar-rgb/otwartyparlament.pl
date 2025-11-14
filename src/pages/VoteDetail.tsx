import { useParams, Link } from 'react-router-dom';
import { votes, voteResults, mps } from '../data/mockData';
import { ArrowLeft, Share2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function VoteDetail() {
  const { id } = useParams();
  const vote = votes.find((v) => v.id === id);

  if (!vote) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Głosowanie nie znalezione.</p>
        <Link to="/glosowania" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
          Wróć do listy głosowań
        </Link>
      </div>
    );
  }

  const voteData = [
    { name: 'Za', value: vote.for, color: '#10b981' },
    { name: 'Przeciw', value: vote.against, color: '#ef4444' },
    { name: 'Wstrzymał się', value: vote.abstained, color: '#eab308' },
    { name: 'Nieobecni', value: vote.absent, color: '#6b7280' },
  ];

  const resultsForVote = voteResults.filter((vr) => vr.voteId === id);
  const mpVotesForThisVote = resultsForVote.map((vr) => {
    const mp = mps.find((m) => m.id === vr.mpId);
    return { mp, vote: vr.vote };
  });

  const partyBreakdown = [
    { party: 'PiS', za: 45, przeciw: 8, wstrzymal: 2, nieobecni: 5 },
    { party: 'KO', za: 38, przeciw: 42, wstrzymal: 3, nieobecni: 4 },
    { party: 'LWA', za: 12, przeciw: 18, wstrzymal: 5, nieobecni: 2 },
    { party: 'TD', za: 28, przeciw: 12, wstrzymal: 2, nieobecni: 3 },
    { party: 'K', za: 15, przeciw: 20, wstrzymal: 4, nieobecni: 2 },
  ];

  return (
    <div className="space-y-8">
      <Link to="/glosowania" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
        <ArrowLeft size={20} />
        Wróć do listy
      </Link>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 rounded-lg p-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-600 mb-2">
              Głosowanie #{vote.number} • {format(new Date(vote.date), 'd MMMM yyyy', { locale: pl })}
            </p>
            <h1 className="text-3xl font-bold text-slate-900">{vote.title}</h1>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-blue-200 rounded-lg transition">
              <Share2 size={20} className="text-blue-600" />
            </button>
            <button className="p-2 hover:bg-blue-200 rounded-lg transition">
              <Download size={20} className="text-blue-600" />
            </button>
          </div>
        </div>

        <p className="text-slate-700 mb-4">{vote.description}</p>

        <div className="flex flex-wrap gap-4">
          <span className={`px-4 py-2 rounded-full font-semibold text-white ${vote.result === 'przyjęto' ? 'bg-green-600' : 'bg-red-600'}`}>
            {vote.result.charAt(0).toUpperCase() + vote.result.slice(1)}
          </span>
          <span className="px-4 py-2 rounded-full bg-slate-700 text-white font-semibold">{vote.category}</span>
          <span className={`px-4 py-2 rounded-full font-semibold ${vote.importance >= 85 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            Ważność: {vote.importance}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Wyniki głosowania</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={voteData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {voteData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Rozkład głosów po partiach</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={partyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="party" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="za" fill="#10b981" name="Za" />
                <Bar dataKey="przeciw" fill="#ef4444" name="Przeciw" />
                <Bar dataKey="wstrzymal" fill="#eab308" name="Wstrzymał się" />
                <Bar dataKey="nieobecni" fill="#6b7280" name="Nieobecni" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Podsumowanie</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Za:</span>
                <span className="font-bold text-green-600">{vote.for}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Przeciw:</span>
                <span className="font-bold text-red-600">{vote.against}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Wstrzymał się:</span>
                <span className="font-bold text-yellow-600">{vote.abstained}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Nieobecni:</span>
                <span className="font-bold text-slate-600">{vote.absent}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Razem:</span>
                <span className="font-bold">{vote.for + vote.against + vote.abstained + vote.absent}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Informacje</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-slate-600">Typ:</p>
                <p className="font-semibold text-slate-900">{vote.type}</p>
              </div>
              <div>
                <p className="text-slate-600">Data:</p>
                <p className="font-semibold text-slate-900">{format(new Date(vote.date), 'd MMMM yyyy', { locale: pl })}</p>
              </div>
              <div>
                <p className="text-slate-600">Kategoria:</p>
                <p className="font-semibold text-slate-900">{vote.category}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Jak głosowali posłowie?</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {mpVotesForThisVote.map((item, idx) => {
            if (!item.mp) return null;
            const voteColor = {
              za: 'text-green-600 bg-green-50',
              przeciw: 'text-red-600 bg-red-50',
              'wstrzymał się': 'text-yellow-600 bg-yellow-50',
              nieobecny: 'text-slate-600 bg-slate-50',
            };
            return (
              <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-200 last:border-b-0">
                <div className="flex items-center gap-3">
                  <img src={item.mp.photoUrl} alt={item.mp.imie} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {item.mp.imie} {item.mp.nazwisko}
                    </p>
                    <p className="text-xs text-slate-500">{item.mp.party}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${voteColor[item.vote as keyof typeof voteColor]}`}>
                  {item.vote}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Chcesz dowiedzieć się więcej?</h3>
        <p className="text-slate-700 mb-4">
          Przejdź do profilu swojego posła, aby zobaczyć jego pełną historię głosowań i aktywność.
        </p>
        <Link to="/poslowie" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
          Przejrzyj posłów
        </Link>
      </div>
    </div>
  );
}
