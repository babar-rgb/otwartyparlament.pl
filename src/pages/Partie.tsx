import { Link } from 'react-router-dom';
import { parties } from '../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

export default function Partie() {
  const partyData = parties.map((p) => ({
    name: p.shortName,
    cohesion: p.cohesion,
    activity: p.activity,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Partie parlamentarne</h1>
        <p className="text-slate-600">
          Przegląd {parties.length} klubów poselskich z aktualnej kadencji Sejmu.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Porównanie partii</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={partyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="cohesion" fill="#3b82f6" name="Spójność" />
            <Bar dataKey="activity" fill="#10b981" name="Aktywność" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {parties.map((party) => (
          <Link key={party.id} to={`/partie/${party.id}`}>
            <div className="bg-white rounded-lg border border-slate-200 hover:shadow-lg hover:border-slate-300 transition overflow-hidden cursor-pointer h-full flex flex-col">
              <div className="h-24 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center border-b border-slate-200">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: party.color }}
                >
                  {party.shortName}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{party.name}</h3>
                <p className="text-xs text-slate-500 mb-4 flex-grow">{party.shortName}</p>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Posłów:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Users size={14} />
                      {party.mpCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Spójność:</span>
                    <span className="font-semibold text-blue-600">{party.cohesion}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Aktywność:</span>
                    <span className="font-semibold text-green-600 flex items-center gap-1">
                      <TrendingUp size={14} />
                      {party.activity}%
                    </span>
                  </div>
                </div>

                <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                  Profil
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Jak czytać wskaźniki?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Spójność partii</h4>
            <p className="text-sm text-slate-700">
              Procent głosowań, w których posłowie z danej partii głosowali jednolicie. Wyższy procent = bardziej dyscyplinowana partia.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">Aktywność</h4>
            <p className="text-sm text-slate-700">
              Średnia liczba projektów ustaw, interpelacji i innych aktywności legislacyjnych na posła w danej partii.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
