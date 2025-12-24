import { useParams, Link } from 'react-router-dom';
import { MapPin, FileText, CheckCircle2, XCircle, MinusCircle, HelpCircle, ArrowLeft, ArrowRight, MessageSquare, Mail, Users, TrendingUp } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { getPartyHexColor } from '../utils/theme';
import SEO from '../components/SEO';
import { useMpProfile } from '../hooks/useMpProfile';

const MpProfile = () => {
  const { idOrSlug } = useParams();
  const {
    mp,
    voteHistory,
    digitizedDeclarations,
    recentSpeeches,
    loading,
    interpellationCount
  } = useMpProfile(idOrSlug);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060613] flex items-center justify-center">
        <div className="text-white/40 text-sm font-medium tracking-wider uppercase">Ładowanie profilu...</div>
      </div>
    );
  }

  if (!mp) {
    return (
      <div className="min-h-screen bg-[#060613] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Poseł nie znaleziony.</p>
          <Link to="/poslowie" className="text-blue-400 hover:text-blue-300 font-semibold">
            ← Wróć do listy posłów
          </Link>
        </div>
      </div>
    );
  }

  const attendance = mp.attendanceRate || 0;
  const rebelVotes = mp.rebelVotes || 0;

  return (
    <div className="min-h-screen bg-[#060613] pt-24 pb-16 px-4 md:px-8">
      <SEO
        title={`${mp.first_name} ${mp.last_name}`}
        description={`Profil posła ${mp.first_name} ${mp.last_name}. Zobacz statystyki głosowań, oświadczenia majątkowe i aktywność w Sejmie.`}
        image={mp.photo_url}
      />

      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link to="/poslowie" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm font-medium transition-colors">
          <ArrowLeft size={16} />
          Wróć do listy posłów
        </Link>

        {/* Hero Section */}
        <div className="bg-[#111126] rounded-3xl border border-white/5 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Photo */}
            <img
              src={mp.photo_url}
              alt={`${mp.first_name} ${mp.last_name}`}
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-white/10"
            />

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
                {mp.first_name} {mp.last_name}
              </h1>

              <div className="flex flex-wrap gap-2 mb-6">
                <span
                  className="px-3 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: getPartyHexColor(mp.club) }}
                >
                  {mp.club}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs font-semibold flex items-center gap-1">
                  <MapPin size={12} />
                  Okręg {mp.district}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/5 text-white/60 text-xs font-semibold">
                  {mp.term === 9 ? 'IX' : 'X'} Kadencja
                </span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl md:text-3xl font-black ${attendance >= 90 ? 'text-emerald-400' : attendance >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {attendance}%
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Frekwencja</div>
                </div>
                <div className="text-center border-x border-white/5">
                  <div className="text-2xl md:text-3xl font-black text-blue-400">{rebelVotes}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Buntów</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-black text-purple-400">{interpellationCount}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Interpelacji</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Activity */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Votes */}
            <div className="bg-[#111126] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400" size={20} />
                <h2 className="text-lg font-bold text-white">Ostatnie Głosowania</h2>
              </div>

              {voteHistory.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {voteHistory.slice(0, 5).map((item, index) => (
                    <Link
                      key={index}
                      to={`/glosowania/${item.votes.term}/${item.votes.sitting}/${item.votes.voting_number}`}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.vote === 'YES' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.vote === 'NO' ? 'bg-rose-500/20 text-rose-400' :
                          item.vote === 'ABSTAIN' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-white/5 text-white/30'
                        }`}>
                        {item.vote === 'YES' && <CheckCircle2 size={18} />}
                        {item.vote === 'NO' && <XCircle size={18} />}
                        {item.vote === 'ABSTAIN' && <MinusCircle size={18} />}
                        {item.vote === 'ABSENT' && <HelpCircle size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-blue-400 transition-colors">
                          {cleanSejmTitle(item.votes.title_clean || item.votes.title_raw || '')}
                        </p>
                        <p className="text-white/40 text-xs">
                          {new Date(item.votes.date).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-white/20 group-hover:text-blue-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-sm">
                  Brak danych o głosowaniach
                </div>
              )}

              <Link to="/glosowania" className="block p-4 text-center text-sm font-semibold text-blue-400 hover:text-blue-300 border-t border-white/5">
                Zobacz wszystkie głosowania →
              </Link>
            </div>

            {/* Recent Speeches */}
            <div className="bg-[#111126] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center gap-3">
                <MessageSquare className="text-blue-400" size={20} />
                <h2 className="text-lg font-bold text-white">Ostatnie Wypowiedzi</h2>
              </div>

              {recentSpeeches.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {recentSpeeches.slice(0, 3).map((speech) => (
                    <Link
                      key={speech.id}
                      to={`/wypowiedzi/${speech.id}`}
                      className="block p-4 hover:bg-white/5 transition-colors cursor-pointer group/speech"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider group-hover/speech:text-blue-400 transition-colors">
                          Posiedzenie {speech.sitting}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className="text-[10px] text-white/30">{speech.date}</span>
                      </div>
                      <p className="text-white/70 text-sm italic line-clamp-2 group-hover/speech:text-white transition-colors">
                        "{speech.content?.substring(0, 150)}..."
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-white/40 text-sm">
                  Brak zarejestrowanych wypowiedzi
                </div>
              )}

              <Link to="/wypowiedzi" className="block p-4 text-center text-sm font-semibold text-blue-400 hover:text-blue-300 border-t border-white/5">
                Przeszukaj stenogramy →
              </Link>
            </div>
          </div>

          {/* Right Column - Stats & Declarations */}
          <div className="space-y-6">

            {/* Activity Stats */}
            <div className="bg-[#111126] rounded-2xl border border-white/5 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                Statystyki Aktywności
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-white/50">Frekwencja</span>
                    <span className="text-xs font-bold text-white">{attendance}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${attendance >= 90 ? 'bg-emerald-500' : attendance >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${attendance}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-white/5 rounded-xl">
                    <div className="text-xl font-black text-blue-400">{rebelVotes}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Głosów wbrew partii</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-xl">
                    <div className="text-xl font-black text-purple-400">{interpellationCount}</div>
                    <div className="text-[9px] text-white/40 uppercase tracking-wider">Interpelacji</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Declarations */}
            {digitizedDeclarations.length > 0 && (
              <div className="bg-[#111126] rounded-2xl border border-white/5 p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-amber-400" />
                  Oświadczenia Majątkowe
                </h3>
                <div className="space-y-3">
                  {digitizedDeclarations.map((decl) => (
                    <div key={decl.id} className="p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white">{decl.year}</span>
                        {decl.file_path && (
                          <a
                            href={decl.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase"
                          >
                            PDF →
                          </a>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white/40">Oszczędności:</span>
                          <span className="text-white font-semibold">{decl.parsed_content?.savings?.toLocaleString() || '—'} PLN</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/40">Dochód:</span>
                          <span className="text-white font-semibold">{decl.parsed_content?.income?.toLocaleString() || '—'} PLN</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interpellations Link */}
            {interpellationCount > 0 && (
              <Link
                to={`/interpelacje?mp_id=${mp.id}`}
                className="block bg-[#111126] rounded-2xl border border-white/5 p-5 hover:border-white/20 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="text-blue-400" size={20} />
                    <div>
                      <h3 className="text-sm font-bold text-white">Interpelacje</h3>
                      <p className="text-xs text-white/40">{interpellationCount} złożonych</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-blue-400" />
                </div>
              </Link>
            )}

            {/* Contact */}
            <div className="bg-[#111126] rounded-2xl border border-white/5 p-5">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Users size={16} className="text-slate-400" />
                Kontakt
              </h3>
              <p className="text-xs text-white/40">
                Oficjalne dane kontaktowe posłów są publikowane na{' '}
                <a href="https://www.sejm.gov.pl" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  sejm.gov.pl
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MpProfile;
