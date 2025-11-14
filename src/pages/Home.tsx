import { useState } from 'react';
import { Link } from 'react-router-dom';
import { votes, mps, parties } from '../data/mockData';
import StatCard from '../components/StatCard';
import VoteCard from '../components/VoteCard';
import { Users, FileText, Vote, TrendingUp, Heart, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Home() {
  const topImportanceVotes = [...votes].sort((a, b) => b.importance - a.importance).slice(0, 4);

  const chartData = [
    { day: 'Pon', votes: 45, bills: 12 },
    { day: 'Wto', votes: 52, bills: 15 },
    { day: 'Śro', votes: 48, bills: 18 },
    { day: 'Czw', votes: 61, bills: 22 },
    { day: 'Pią', votes: 55, bills: 19 },
    { day: 'Sob', votes: 42, bills: 14 },
    { day: 'Nie', votes: 38, bills: 10 },
  ];

  const partyStats = [
    { name: 'PiS', alignment: 92 },
    { name: 'KO', alignment: 88 },
    { name: 'LWA', alignment: 85 },
    { name: 'TD', alignment: 78 },
    { name: 'K', alignment: 72 },
  ];

  return (
    <div className="space-y-12">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 md:p-12 shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Otwarty Parlament</h1>
        <p className="text-lg md:text-xl mb-6 text-blue-100">
          Transparentna platforma do śledzenia każdego głosowania w Sejmie. Sprawdzaj, jak Twoi posłowie i partie głosują.
        </p>
        <div className="flex gap-4 flex-wrap">
          <Link to="/glosowania" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
            Explore Votes
          </Link>
          <Link to="/test" className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition border-2 border-blue-400">
            Test Wyborczy
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label="Posłowie" value={460} color="blue" />
        <StatCard icon={FileText} label="Głosowania" value={2847} color="green" />
        <StatCard icon={Vote} label="Partie" value="5" color="purple" />
        <StatCard icon={TrendingUp} label="Średnia aktywność" value="87%" change={5} color="orange" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Najważniejsze głosowania ostatnich 7 dni</h2>
          <Link to="/glosowania" className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            Zobacz wszystkie →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topImportanceVotes.map((vote) => (
            <VoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Aktywność w Sejmie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="votes" stroke="#3b82f6" strokeWidth={2} name="Głosowania" />
              <Line type="monotone" dataKey="bills" stroke="#10b981" strokeWidth={2} name="Projekty ustaw" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Zgodność z linią partii</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="alignment" fill="#3b82f6" name="Zgodność (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Najaktywniejsi posłowie</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mps.slice(0, 3).map((mp) => (
            <div key={mp.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={mp.photoUrl}
                  alt={`${mp.imie} ${mp.nazwisko}`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-bold text-slate-900">
                    {mp.imie} {mp.nazwisko}
                  </h3>
                  <p className="text-sm text-slate-600">{mp.party}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Głosów:</span>
                  <span className="font-semibold">{mp.votesCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ustaw:</span>
                  <span className="font-semibold">{mp.billsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Aktywność:</span>
                  <span className="font-semibold text-blue-600">{mp.aktywnosc}%</span>
                </div>
              </div>

              <Link to={`/poslowie/${mp.id}`} className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-center text-sm">
                Profil
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200 p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            Przejrzystość dla demokracji
          </h3>
          <p className="text-slate-700 mb-6">
            Otwarty Parlament to niekomercyjny projekt dedykowany przejrzystości polskiego systemu parlamentarnego.
            Wierzymy, że obywatele mają prawo wiedzieć, jak głosują ich reprezentanci.
          </p>
          <Link to="/o-projekcie" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Dowiedz się więcej
          </Link>
        </div>
      </section>
    </div>
  );
}
