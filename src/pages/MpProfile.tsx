import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MP } from '../api';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, MapPin } from 'lucide-react';

export default function MpProfile() {
  const { id } = useParams();
  const [mp, setMp] = useState<MP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMp = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('mps')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Map DB columns to MP interface
        const mappedMp: MP = {
          id: data.id,
          first_name: data.name.split(' ')[0],
          last_name: data.name.split(' ').slice(1).join(' '),
          club: data.party,
          district: data.district,
          photo_url: data.photo_url,
          attendanceRate: Math.round(data.stats_attendance || 0),
          active: data.active,
          rebelVotes: data.stats_rebellion || 0,
          email: '', // Not in DB yet, could add later
          voivodeship: '' // Not in DB yet
        };

        setMp(mappedMp);
      } catch (error) {
        console.error('Error fetching MP:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMp();
  }, [id]);

  if (loading) return <div className="text-center py-12">Ładowanie profilu posła...</div>;

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

  const getPartyColor = (party: string) => {
    const colors: Record<string, string> = {
      'PiS': '#800000',
      'KO': '#0096FF',
      'Polska2050': '#00A150',
      'PSL-TD': '#90EE90',
      'Lewica': '#FF0000',
      'Konfederacja': '#000080',
      'INNE': '#1F2937',
    };
    return colors[party] || '#64748B';
  };

  // Use real stats from DB
  const attendance = mp.attendanceRate || 0;
  const rebelVotes = mp.rebelVotes || 0;
  const speeches = Math.floor(Math.random() * 30) + 5; // Speeches not yet in DB, keeping mock for now

  // Use photo URL from DB
  const photoUrl = mp.photo_url;

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-8">
      {/* Back Button */}
      <Link to="/poslowie" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold">
        <ArrowLeft size={20} />
        Wróć do listy
      </Link>

      {/* SECTION A: Identity Header (Wizytówka) */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Large Photo */}
          <img
            src={photoUrl}
            alt={`${mp.first_name} ${mp.last_name}`}
            className="w-48 h-48 md:w-64 md:h-64 rounded-xl object-cover shadow-md"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/256x256/E2E8F0/64748B?text=MP';
            }}
          />

          {/* Identity Info */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              {mp.first_name} {mp.last_name}
            </h1>

            {/* Badges Row */}
            <div className="flex flex-wrap gap-3">
              {/* Party Badge */}
              <span
                className="px-4 py-2 rounded-full text-white text-sm font-bold uppercase tracking-wide shadow-sm"
                style={{ backgroundColor: getPartyColor(mp.club) }}
              >
                {mp.club}
              </span>

              {/* District Badge */}
              <span className="px-4 py-2 rounded-full bg-slate-200 text-slate-700 text-sm font-bold uppercase tracking-wide">
                <MapPin size={14} className="inline mr-1" />
                {mp.districtNum && mp.districtName
                  ? `Okręg ${mp.districtNum}: ${mp.districtName}`
                  : `Okręg ${mp.district}`
                }
              </span>

              {/* Role Badge */}
              <span className="px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold">
                Poseł na Sejm X Kadencji
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: KPI Grid (Key Performance Indicators) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Attendance */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
          <div className={`text-6xl font-black mb-2 ${attendance >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
            {attendance}%
          </div>
          <p className="text-slate-600 font-semibold mb-4">
            Frekwencja na głosowaniach
          </p>
          {/* Progress Bar */}
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full ${attendance >= 90 ? 'bg-green-600' : 'bg-orange-600'}`}
              style={{ width: `${attendance}%` }}
            />
          </div>
        </div>

        {/* Card 2: Rebel Votes */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
          <div className="text-6xl font-black text-orange-600 mb-2">
            {rebelVotes}
          </div>
          <p className="text-slate-600 font-semibold">
            Głosów przeciw partii
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Niezależność od linii klubowej
          </p>
        </div>

        {/* Card 3: Speeches */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-sm">
          <div className="text-6xl font-black text-blue-600 mb-2">
            {speeches}
          </div>
          <p className="text-slate-600 font-semibold">
            Wystąpienia na mównicy
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Aktywność w debacie publicznej
          </p>
        </div>
      </div>

      {/* SECTION C: Voting History Timeline */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Jak głosował(a) w kluczowych sprawach?
        </h2>

        <div className="space-y-4">
          {/* Vote 1 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-4 border-b border-slate-200">
            <span className="text-slate-700 font-medium">Ustawa o finansowaniu In Vitro</span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-bold text-sm uppercase tracking-wide w-fit">
              Za
            </span>
          </div>

          {/* Vote 2 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-4 border-b border-slate-200">
            <span className="text-slate-700 font-medium">Wotum zaufania dla rządu</span>
            <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full font-bold text-sm uppercase tracking-wide w-fit">
              Przeciw
            </span>
          </div>

          {/* Vote 3 */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-4">
            <span className="text-slate-700 font-medium">Zamrożenie cen energii</span>
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-bold text-sm uppercase tracking-wide w-fit">
              Wstrzymał się
            </span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <Link
            to="/glosowania"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Zobacz wszystkie głosowania →
          </Link>
        </div>
      </div>

      {/* SECTION D: Contact */}
      <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Kontakt</h3>
        {mp.email ? (
          <div className="space-y-3">
            <div className="flex gap-3 items-center">
              <Mail size={24} className="text-blue-600" />
              <a
                href={`mailto:${mp.email}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {mp.email}
              </a>
            </div>
            {mp.voivodeship && (
              <p className="text-sm text-slate-600">
                Województwo: {mp.voivodeship}
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-6 items-center">
            <Mail size={24} className="text-blue-600" />
            <span className="text-slate-600">Dane kontaktowe dostępne na stronie Sejmu</span>
          </div>
        )}
        <p className="text-sm text-slate-500 mt-4">
          Oficjalne dane kontaktowe posłów są publikowane na{' '}
          <a href="https://www.sejm.gov.pl" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            sejm.gov.pl
          </a>
        </p>
      </div>
    </div>
  );
}
