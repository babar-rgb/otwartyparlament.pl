import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { fetchMPs } from '../api';
import { getPartyData } from '../constants/parties';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp } from 'lucide-react';

interface PartyStats {
  id: string; // Matches DB 'party' column
  mpCount: number;
}

export default function Partie() {
  const [parties, setParties] = useState<(PartyStats & { metadata: any })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartiesAction = async () => {
      try {
        const mps = await fetchMPs({ active: true, limit: 1000 });

        const counts: Record<string, number> = {};
        (mps || []).forEach((mp: any) => {
          const p = mp.club || 'Niezrzeszeni';
          counts[p] = (counts[p] || 0) + 1;
        });

        const result = Object.entries(counts).map(([partyKey, count]) => {
          const metadata = getPartyData(partyKey);
          return {
            id: partyKey,
            mpCount: count,
            metadata
          };
        }).sort((a, b) => b.mpCount - a.mpCount);

        setParties(result);
      } catch (err) {
        console.error("Error fetching parties:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartiesAction();
  }, []);

  const chartData = parties.slice(0, 7).map(p => ({
    name: p.metadata.shortName,
    count: p.mpCount,
    fill: p.metadata.color
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <SEO
        title="Kluby i Koła Poselskie"
        description="Lista wszystkich partii, klubów i kół poselskich w Sejmie X kadencji. Sprawdź liczbę posłów i statystyki."
        url="/partie"
      />
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Partie parlamentarne</h1>
        <p className="text-slate-600">
          Przegląd {parties.length} klubów i kół poselskich X kadencji Sejmu.
          <br />
          <span className="text-xs text-slate-400">*Dane aktualne, pobierane z bazy danych.</span>
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Liczebność klubów</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Bar dataKey="count" name="Liczba posłów" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {parties.map((party) => (
          <Link key={party.id} to={`/partie/${party.id}`}>
            <div className="bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-md transform hover:-translate-y-1 duration-200">
              <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundColor: party.metadata.color }}
                />
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg relative z-10"
                  style={{ backgroundColor: party.metadata.color }}
                >
                  {party.metadata.shortName}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{party.metadata.name}</h3>

                <div className="space-y-2 pt-4 mt-auto border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Posłów:</span>
                    <span className="font-semibold flex items-center gap-1 text-slate-900">
                      <Users size={14} />
                      {party.mpCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs opacity-50" title="Dane w przygotowaniu">
                    <span className="text-slate-600">Aktywność:</span>
                    <span className="font-semibold text-slate-400 flex items-center gap-1">
                      <TrendingUp size={14} />
                      -
                    </span>
                  </div>
                </div>

                <div className="mt-4 w-full bg-slate-50 text-slate-600 py-2 rounded-lg font-semibold hover:bg-slate-100 transition text-sm text-center">
                  Profil
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
