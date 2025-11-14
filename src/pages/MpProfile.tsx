import { useParams, Link } from 'react-router-dom';
import { mps, votes, voteResults, parties } from '../data/mockData';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, Mail, MapPin, Award, FileText } from 'lucide-react';

export default function MpProfile() {
  const { id } = useParams();
  const mp = mps.find((m) => m.id === id);

  if (!mp) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Poseł nie znaleziony.</p>
        <Link to="/poslowie" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
          Wróć do listy posłów
        </Link>
      </div>
    );
  }

  const party = parties.find((p) => p.shortName === mp.party);
  const mpVotes = voteResults.filter((vr) => vr.mpId === mp.id);
  const mpVoteStats = {
    za: mpVotes.filter((v) => v.vote === 'za').length,
    przeciw: mpVotes.filter((v) => v.vote === 'przeciw').length,
    wstrzymal: mpVotes.filter((v) => v.vote === 'wstrzymał się').length,
    nieobecny: mpVotes.filter((v) => v.vote === 'nieobecny').length,
  };

  const activityData = [
    { month: 'Sty', votes: 140 },
    { month: 'Lut', votes: 125 },
    { month: 'Mar', votes: 145 },
    { month: 'Kwi', votes: 155 },
    { month: 'Maj', votes: 160 },
    { month: 'Cze', votes: 170 },
  ];

  const voteDistribution = [
    { name: 'Za', value: mpVoteStats.za, color: '#10b981' },
    { name: 'Przeciw', value: mpVoteStats.przeciw, color: '#ef4444' },
    { name: 'Wstrzymał się', value: mpVoteStats.wstrzymal, color: '#eab308' },
    { name: 'Nieobecny', value: mpVoteStats.nieobecny, color: '#6b7280' },
  ];

  return (
    <div className="space-y-8">
      <Link to="/poslowie" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
        <ArrowLeft size={20} />
        Wróć do listy
      </Link>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 p-8">
          <img
            src={mp.photoUrl}
            alt={`${mp.imie} ${mp.nazwisko}`}
            className="w-32 h-40 rounded-lg object-cover shadow-lg"
          />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold text-slate-900">
                {mp.imie} {mp.nazwisko}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-bold text-white`} style={{ backgroundColor: party?.color }}>
                {mp.party}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={18} />
                Okręg: {mp.district}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Award size={18} />
                Kadencja: IX i X
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div>
                <p className="text-sm text-slate-600">Głosów</p>
                <p className="text-2xl font-bold text-blue-600">{mp.votesCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Ustaw</p>
                <p className="text-2xl font-bold text-green-600">{mp.billsCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Interpelacji</p>
                <p className="text-2xl font-bold text-purple-600">{mp.interpellationsCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Obecność</p>
                <p className="text-2xl font-bold text-orange-600">{mp.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Aktywność w Sejmie</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="votes" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Rozkład głosów</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={voteDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                {voteDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            {voteDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Wskaźniki
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Zgodność z partią</span>
                <span className="text-sm font-bold text-slate-900">{mp.partyAlignment}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${mp.partyAlignment}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Aktywność</span>
                <span className="text-sm font-bold text-slate-900">{mp.aktywnosc}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${mp.aktywnosc}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Obecność</span>
                <span className="text-sm font-bold text-slate-900">{mp.attendanceRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: `${mp.attendanceRate}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Kontakt</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-blue-600" />
              <span className="text-slate-700">info@parlamentarny.pl</span>
            </div>
            <p className="text-sm text-slate-600">
              Zbiór rzeczywistych danych kontaktowych posłów jest dostępny na stronie Sejmu.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Historia głosowań</h3>
        <p className="text-slate-600 mb-4">
          Poseł {mp.imie} {mp.nazwisko} wziął udział w {mpVotes.length} głosowaniach.
        </p>
        <Link to="/glosowania" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
          Przejrzyj głosowania
        </Link>
      </div>
    </div>
  );
}
