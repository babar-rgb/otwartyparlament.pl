import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { MP } from '../api';
import { supabase } from '../lib/supabase';
import { MapPin, Mail, FileText, Sparkles, Scale, Star, CheckCircle2, XCircle, MinusCircle, HelpCircle, ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';

interface VoteHistoryItem {
  vote: string;
  votes: {
    id: number;
    sitting: number;
    voting_number: number;
    title_clean: string;
    title_raw?: string;
    date: string;
    verdict: string;
    category?: string;
    term: number;
  };
}

interface AssetDeclaration {
  id: number;
  pdf_url: string;
  year: string;
  summary: string;
  parsed_content: {
    savings: number;
    real_estate: string[];
    income: number;
    car: string[];
  };
}

const MpProfile = () => {
  const { id } = useParams();
  const [mp, setMp] = useState<MP | null>(null);
  const [voteHistory, setVoteHistory] = useState<VoteHistoryItem[]>([]);
  const [keyDecisions, setKeyDecisions] = useState<VoteHistoryItem[]>([]);
  const [digitizedDeclarations, setDigitizedDeclarations] = useState<AssetDeclaration[]>([]);
  const [recentSpeeches, setRecentSpeeches] = useState<any[]>([]);
  const [consistencyReports, setConsistencyReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [interpellations, setInterpellations] = useState<{ id: number; title: string; sent_date: string }[]>([]);

  useEffect(() => {
    const loadMpData = async () => {
      if (!id) return;
      try {
        // 1. Fetch MP Details
        const { data: mpData, error: mpError } = await supabase
          .from('mps')
          .select('*')
          .eq('id', id)
          .single();

        if (mpError) throw mpError;

        // Map DB columns to MP interface
        const mappedMp: MP = {
          id: mpData.id,
          first_name: mpData.name.split(' ')[0],
          last_name: mpData.name.split(' ').slice(1).join(' '),
          club: mpData.party,
          district: mpData.district,
          photo_url: mpData.photo_url,
          attendanceRate: Math.round(mpData.stats_attendance || 0),
          active: mpData.active,
          rebelVotes: mpData.stats_rebellion || 0,
          email: '',
          voivodeship: '',
          declarations: mpData.declarations || [],
          term: mpData.term // Add term to mapped object
        };

        setMp(mappedMp);

        // Fetch digitized declarations
        const { data: declData } = await supabase
          .from('asset_declarations')
          .select('*')
          .eq('mp_id', mpData.id);

        if (declData) setDigitizedDeclarations(declData);

        // Fetch recent speeches
        const { data: speechData } = await supabase
          .from('speeches')
          .select('*')
          .eq('mp_id', id)
          .order('date', { ascending: false })
          .limit(3);

        if (speechData) setRecentSpeeches(speechData);

        // Fetch consistency reports
        const { data: consistencyData } = await supabase
          .from('consistency_reports')
          .select('*')
          .eq('mp_id', id)
          .order('created_at', { ascending: false });

        if (consistencyData) setConsistencyReports(consistencyData);

        // 2. Fetch Voting History (Last 10)
        const { data: historyData, error: historyError } = await supabase
          .from('vote_results')
          .select('vote, votes!inner(id, sitting, voting_number, title_clean, title_raw, date, verdict, term)')
          .eq('mp_id', id)
          .order('vote_id', { ascending: false })
          .limit(10);

        if (!historyError && historyData) {
          setVoteHistory(historyData as unknown as VoteHistoryItem[]);
        }

        // 3. Fetch Key Decisions (Key Votes)
        const { data: keyData, error: keyError } = await supabase
          .from('vote_results')
          .select('vote, votes!inner(id, sitting, voting_number, title_clean, title_raw, date, verdict, category, is_key_vote)')
          .eq('mp_id', id)
          .eq('votes.is_key_vote', true)
          .order('vote_id', { ascending: false })
          .limit(5);

        if (!keyError && keyData) {
          setKeyDecisions(keyData as unknown as VoteHistoryItem[]);
        }

        // 4. Fetch Interpellations (New)
        const { data: interpellationData, error: interpellationError } = await supabase
          .from('interpellation_authors')
          .select('interpellations(id, title, sent_date)')
          .eq('mp_id', id)
          .order('interpellation_id', { ascending: false })
          .limit(5);

        if (!interpellationError && interpellationData) {
          const mappedInterpellations = interpellationData.map((item: any) => item.interpellations);
          setInterpellations(mappedInterpellations);
        }

      } catch (error) {
        console.error('Error fetching MP data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadMpData();
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
    <div className="max-w-5xl mx-auto space-y-6 pt-24 pb-12 px-4 animate-fade-in">
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
            className="w-48 h-48 md:w-64 md:h-64 rounded-xl object-cover"
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
                Poseł na Sejm {mp.term === 9 ? 'IX' : 'X'} Kadencji
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

      {/* Consistency Analysis Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
            <Scale size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Analiza Spójności (AI)</h2>
        </div>

        <div className="space-y-4">
          {consistencyReports.length > 0 ? (
            consistencyReports.map((report) => (
              <div key={report.id} className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-slate-900">{report.topic}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.verdict === 'Spójny' ? 'bg-green-100 text-green-700' :
                    report.verdict === 'Niespójny' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                    {report.verdict}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Co mówił:</p>
                    <p className="text-sm text-slate-700 italic">"{report.speech_quote}"</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Jak głosował:</p>
                    <p className="text-sm text-slate-700">{report.vote_result}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-600 bg-purple-50 p-3 rounded-lg">
                  <Sparkles size={16} className="text-purple-500 mt-0.5 shrink-0" />
                  <p>{report.analysis}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>Brak raportów spójności dla tego posła.</p>
              <p className="text-xs mt-2">Analiza jest generowana okresowo dla kluczowych tematów.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Speeches Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <MessageSquare size={24} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Ostatnie Wypowiedzi</h2>
        </div>

        <div className="space-y-4">
          {recentSpeeches.length > 0 ? (
            recentSpeeches.map((speech) => (
              <div key={speech.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Posiedzenie {speech.sitting} • {speech.date}
                  </span>
                </div>
                <p className="text-slate-700 text-sm line-clamp-3 italic">
                  "{speech.content}"
                </p>
                <Link to={`/wypowiedzi?q=${encodeURIComponent(speech.content.slice(0, 50))}`} className="text-xs font-bold text-blue-600 mt-2 inline-block hover:underline">
                  Zobacz pełną wypowiedź &rarr;
                </Link>
              </div>
            ))
          ) : (
            <p className="text-slate-500 italic">Brak zarejestrowanych wypowiedzi w bazie.</p>
          )}

          <Link to="/wypowiedzi" className="block text-center text-sm font-bold text-slate-500 hover:text-blue-600 mt-4 transition-colors">
            Przeszukaj wszystkie stenogramy &rarr;
          </Link>
        </div>
      </div>

      {/* SECTION G: Asset Declarations (NEW) */}
      {mp.declarations && mp.declarations.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FileText size={24} className="text-emerald-600" />
            Oświadczenia Majątkowe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mp.declarations.map((decl, idx) => (
              <a
                key={idx}
                href={decl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
              >
                <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                  <FileText size={20} />
                </div>
                <span className="font-medium text-slate-700 group-hover:text-emerald-800 transition-colors">
                  {decl.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}


      {/* SECTION H: Digitized Declarations (AI) */}
      {
        digitizedDeclarations.length > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-100 p-8 shadow-sm mb-8">
            <h2 className="text-2xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
              <Sparkles size={24} className="text-emerald-600" />
              Analiza Majątku (AI)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {digitizedDeclarations.map((decl) => (
                <div key={decl.id} className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{decl.year}</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full font-medium">
                      AI Analysis
                    </span>
                  </div>

                  <p className="text-slate-600 italic mb-4 text-sm border-l-4 border-emerald-200 pl-3">
                    "{decl.summary}"
                  </p>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Oszczędności:</span>
                      <span className="font-bold text-slate-900">{decl.parsed_content.savings?.toLocaleString()} PLN</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Dochód roczny:</span>
                      <span className="font-bold text-slate-900">{decl.parsed_content.income?.toLocaleString()} PLN</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-1">Nieruchomości:</span>
                      <ul className="list-disc list-inside text-slate-700 space-y-1">
                        {decl.parsed_content.real_estate?.map((item, i) => (
                          <li key={i} className="truncate">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* SECTION C: Key Decisions (NEW) */}
      {
        keyDecisions.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-100 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Star size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Kluczowe Decyzje
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {keyDecisions.map((item, index) => (
                <div key={index} className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
                      {item.votes.category || 'WAŻNE'}
                    </span>
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(item.votes.date).toLocaleDateString('pl-PL')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-4 line-clamp-2 min-h-[3rem]">
                    {cleanSejmTitle(item.votes.title_clean || item.votes.title_raw || '')}
                  </h3>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-sm text-slate-500">Głos posła:</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm uppercase tracking-wide ${item.vote === 'YES' ? 'bg-green-100 text-green-700' :
                      item.vote === 'NO' ? 'bg-red-100 text-red-700' :
                        item.vote === 'ABSTAIN' ? 'bg-neutral-100 text-neutral-700' :
                          'bg-slate-100 text-slate-500'
                      }`}>
                      {item.vote === 'YES' && <CheckCircle2 size={14} />}
                      {item.vote === 'NO' && <XCircle size={14} />}
                      {item.vote === 'ABSTAIN' && <MinusCircle size={14} />}

                      {item.vote === 'YES' ? 'ZA' :
                        item.vote === 'NO' ? 'PRZECIW' :
                          item.vote === 'ABSTAIN' ? 'WSTRZ.' : 'NIEOB.'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      {/* SECTION F: Interpellations (NEW) */}
      {
        interpellations.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Mail size={24} className="text-blue-600" />
              Ostatnie Interpelacje
            </h2>
            <div className="space-y-4">
              {interpellations.map((interpellation) => (
                <a
                  key={interpellation.id}
                  href={`https://sejm.gov.pl/Sejm10.nsf/interpelacja.xsp?typ=INT&nr=${interpellation.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
                        {interpellation.title}
                      </h3>
                      <span className="text-xs text-slate-500">
                        Nr {interpellation.id} • Złożono: {interpellation.sent_date}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors mt-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )
      }

      {/* SECTION D: Voting History Timeline */}
      <div className="bg-white rounded-xl border-2 border-slate-200 p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          Ostatnie głosowania
        </h2>

        {voteHistory.length > 0 ? (
          <div className="space-y-4">
            {voteHistory.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2">
                <div className="flex-1">
                  <div className="text-xs text-slate-500 mb-1">
                    {new Date(item.votes.date).toLocaleDateString('pl-PL')} • Posiedzenie {item.votes.sitting}
                  </div>
                  <Link to={`/glosowania/${item.votes.term}/${item.votes.sitting}/${item.votes.voting_number}`} className="text-slate-900 font-medium hover:text-blue-600 transition-colors line-clamp-2">
                    {cleanSejmTitle(item.votes.title_clean || item.votes.title_raw || '')}
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  {/* MP Vote */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide w-fit border ${item.vote === 'YES' ? 'bg-green-100 text-green-800 border-green-200' :
                    item.vote === 'NO' ? 'bg-red-100 text-red-800 border-red-200' :
                      item.vote === 'ABSTAIN' ? 'bg-neutral-100 text-neutral-800 border-neutral-200' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                    {item.vote === 'YES' && <CheckCircle2 size={16} />}
                    {item.vote === 'NO' && <XCircle size={16} />}
                    {item.vote === 'ABSTAIN' && <MinusCircle size={16} />}
                    {item.vote === 'ABSENT' && <HelpCircle size={16} />}

                    {item.vote === 'YES' ? 'ZA' :
                      item.vote === 'NO' ? 'PRZECIW' :
                        item.vote === 'ABSTAIN' ? 'WSTRZ.' : 'NIEOB.'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-2">
              {mp.term === 9
                ? 'Archiwum IX Kadencji - Szczegółowe wyniki głosowań są w trakcie migracji.'
                : 'Brak danych o ostatnich głosowaniach.'}
            </p>
            {mp.term === 9 && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                Dane historyczne
              </span>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-200">
          <Link
            to="/glosowania"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Zobacz wszystkie głosowania →
          </Link>
        </div>
      </div>

      {/* SECTION E: Contact */}
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

export default MpProfile;
