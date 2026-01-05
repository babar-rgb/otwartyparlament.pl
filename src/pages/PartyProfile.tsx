import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchMPs } from '../api';
import { getPartyData } from '../constants/parties';
import SEO from '../components/SEO';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';

export default function PartyProfile() {
  const { id } = useParams();
  const [mps, setMps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const partyMetadata = id ? getPartyData(id) : null;

  useEffect(() => {
    if (!id) return;

    const fetchPartyMpsAction = async () => {
      try {
        const data = await fetchMPs({ limit: 1000, active: true });
        // Filter locally for now as fetchMPs doesn't have club/party filter yet
        const filteredResult = data.filter((mp: any) => mp.club === id);
        setMps(filteredResult);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPartyMpsAction();
  }, [id]);

  if (!partyMetadata) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Nieprawidłowy identyfikator partii.</p>
        <Link to="/partie" className="text-blue-600 hover:text-blue-700 font-semibold mt-4 inline-block">
          Wróć do listy partii
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const mpCount = mps.length;
  const topMps = mps.slice(0, 5);

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 space-y-8 animate-fade-in">
      <SEO
        title={partyMetadata.name}
        description={`Profil klubu parlamantarnego ${partyMetadata.name} (${partyMetadata.shortName}). Liczba posłów: ${mpCount}. Zobacz listę członków i statystyki.`}
        url={`/partie/${id}`}
      />
      <Link to="/partie" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mb-4">
        <ArrowLeft size={20} />
        Wróć do listy
      </Link>

      <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 p-8">
          <div
            className="w-24 h-24 rounded-lg flex items-center justify-center text-white font-bold text-4xl shadow-md"
            style={{ backgroundColor: partyMetadata.color }}
          >
            {partyMetadata.shortName}
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{partyMetadata.name}</h1>
            <p className="text-slate-600 mb-4">{partyMetadata.shortName} • {mpCount} posłów</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Posłów</p>
                <p className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                  <span className="flex items-center gap-2">
                    <Users size={20} />
                    {mpCount}
                  </span>
                </p>
              </div>
              <div className="opacity-50" title="Dane niedostępne">
                <p className="text-sm text-slate-600">Spójność</p>
                <p className="text-2xl font-bold text-slate-400">-</p>
              </div>
              <div className="opacity-50" title="Dane niedostępne">
                <p className="text-sm text-slate-600">Aktywność</p>
                <p className="text-2xl font-bold text-slate-400 flex items-center gap-2">
                  <TrendingUp size={20} />
                  -
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Przykładowi posłowie</h3>
        <div className="space-y-3">
          {topMps.map((mp, idx) => (
            <Link key={mp.id} to={`/poslowie/${mp.id}`} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-500 flex items-center justify-center text-sm">
                  {idx + 1}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs overflow-hidden">
                    {(mp.photo_url) ? <img src={mp.photo_url} className="w-full h-full object-cover" /> : mp.first_name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {mp.first_name} {mp.last_name}
                    </p>
                    <p className="text-xs text-slate-500">{mp.district || "Okręg nieznany"}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <div className="pt-4 text-center">
            <Link to={`/poslowie?club=${partyMetadata.id}`} className="text-blue-600 hover:underline text-sm font-semibold">
              Zobacz wszystkich posłów z tego klubu ({mpCount}) →
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-bold text-slate-900 mb-2">Głosowania partii</h4>
        <p className="text-sm text-slate-700 mb-4">
          Analiza grupowa głosowań (Spójność) jest w trakcie przygotowania na podstawie danych rzeczywistych.
        </p>
        <Link to="/glosowania" className="inline-block text-blue-600 hover:text-blue-700 font-semibold text-sm">
          Przejrzyj ostatnie głosowania Sejmu →
        </Link>
      </div>
    </div>
  );
}
