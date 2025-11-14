import { useParams, Link } from 'react-router-dom';
import { parties, mps } from '../data/mockData';
import { ArrowLeft, Users, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function PartyProfile() {
  const { id } = useParams();
  const party = parties.find((p) => p.id === id);
  const partyMps = mps.filter((mp) => mp.party === party?.shortName);

  if (!party) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Partia nie znaleziona.</p>
        <Link to="/partie" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
          Wróć do listy partii
        </Link>
      </div>
    );
  }

  const activityData = [
    { month: 'Sty', votes: 145 },
    { month: 'Lut', votes: 128 },
    { month: 'Mar', votes: 152 },
    { month: 'Kwi', votes: 168 },
    { month: 'Maj', votes: 175 },
    { month: 'Cze', votes: 182 },
  ];

  const topMps = partyMps.sort((a, b) => b.aktywnosc - a.aktywnosc).slice(0, 5);

  return (
    <div className="space-y-8">
      <Link to="/partie" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
        <ArrowLeft size={20} />
        Wróć do listy
      </Link>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 p-8">
          <div className="w-24 h-24 rounded-lg flex items-center justify-center text-white font-bold text-4xl" style={{ backgroundColor: party.color }}>
            {party.shortName}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{party.name}</h1>
            <p className="text-slate-600 mb-4">{party.shortName} • {partyMps.length} posłów</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Posłów</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <Users size={20} />
                  {party.mpCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Spójność</p>
                <p className="text-2xl font-bold text-blue-600">{party.cohesion}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Aktywność</p>
                <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                  <TrendingUp size={20} />
                  {party.activity}%
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Średnia aktywność</p>
                <p className="text-2xl font-bold">{Math.round((party.cohesion + party.activity) / 2)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Aktywność w czasie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="votes" stroke={party.color} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Wskaźniki</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Spójność</span>
                <span className="text-sm font-bold">{party.cohesion}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${party.cohesion}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Aktywność</span>
                <span className="text-sm font-bold">{party.activity}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${party.activity}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Najaktywniejszy posłowie</h3>
        <div className="space-y-3">
          {topMps.map((mp, idx) => (
            <Link key={mp.id} to={`/poslowie/${mp.id}`} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-300 font-bold text-white flex items-center justify-center text-sm">
                  {idx + 1}
                </div>
                <div className="flex items-center gap-3">
                  <img src={mp.photoUrl} alt={mp.imie} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {mp.imie} {mp.nazwisko}
                    </p>
                    <p className="text-xs text-slate-500">{mp.district}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{mp.aktywnosc}%</p>
                <p className="text-xs text-slate-500">Aktywność</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-bold text-slate-900 mb-2">Głosowania partii</h4>
          <p className="text-sm text-slate-700 mb-4">
            {partyMps.length > 0
              ? `Przejrzyj wszystkie głosowania członków tej partii i zobacz wzorce głosowania.`
              : 'Brak danych'}
          </p>
          <Link to="/glosowania" className="inline-block text-blue-600 hover:text-blue-700 font-semibold text-sm">
            Przejrzyj głosowania →
          </Link>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h4 className="font-bold text-slate-900 mb-2">Projekty ustaw</h4>
          <p className="text-sm text-slate-700 mb-4">
            {partyMps.length > 0
              ? `${partyMps.reduce((acc, mp) => acc + mp.billsCount, 0)} projektów ustaw złożonych przez członków tej partii.`
              : 'Brak danych'}
          </p>
          <Link to="/poslowie" className="inline-block text-green-600 hover:text-green-700 font-semibold text-sm">
            Przejrzyj posłów →
          </Link>
        </div>
      </div>
    </div>
  );
}
