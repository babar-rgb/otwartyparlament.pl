import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, FileText, CheckCircle2, XCircle, MinusCircle, HelpCircle, ArrowLeft, ArrowRight, MessageSquare, Mail, Users, TrendingUp, Sparkles } from 'lucide-react';
import { cleanSejmTitle } from '../utils/titleFormatter';
import { getPartyHexColor } from '../utils/theme';
import SEO from '../components/SEO';
import { useMpProfile } from '../hooks/useMpProfile';

const MpProfile = () => {
  const { idOrSlug } = useParams();
  // Destructure new data
  const {
    mp,
    voteHistory,
    keyVotes,
    digitizedDeclarations,
    recentSpeeches,
    loading,
    interpellationCount,
    stats,
    relations
  } = useMpProfile(idOrSlug);

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-secondary text-sm font-black tracking-[0.3em] uppercase animate-pulse">System Intelligence Loading...</div>
      </div>
    );
  }

  if (!mp) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary mb-4">Poseł nie znaleziony.</p>
          <Link to="/poslowie" className="text-blue-500 hover:text-blue-600 font-semibold">
            ← Wróć do listy posłów
          </Link>
        </div>
      </div>
    );
  }

  const attendance = mp.attendanceRate || 0;
  const rebelVotes = mp.rebelVotes || 0;

  // Extract Badges
  const badges = stats?.badges ? stats.badges : [];

  // Extract Priorities
  const topPriorities = stats?.top_priorities ? stats.top_priorities : [];

  // Extract Twins
  const ideologicalTwin = relations?.find(r => r.relation_type === 'ideological_twin');
  const oppositionTwin = relations?.find(r => r.relation_type === 'opposition_twin');

  return (
    <div className="min-h-screen bg-page pt-24 pb-16 px-4 md:px-8 text-primary">
      <SEO
        title={`${mp.first_name} ${mp.last_name}`}
        description={`Profil posła ${mp.first_name} ${mp.last_name}. Zobacz statystyki głosowań, oświadczenia majątkowe i aktywność w Sejmie.`}
        image={mp.photo_url}
      />

      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link to="/poslowie" className="inline-flex items-center gap-2 text-secondary hover:text-primary mb-6 text-sm font-medium transition-colors">
          <ArrowLeft size={16} />
          Wróć do listy posłów
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface/80 backdrop-blur-xl rounded-3xl border border-border-base p-6 md:p-8 mb-6 shadow-2xl overflow-hidden relative"
        >
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
            {/* Photo */}
            <div className="relative group/photo">
              <div className="absolute -inset-1 bg-gradient-to-br from-accent-blue/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover/photo:opacity-100 transition-opacity duration-500" />
              <img
                src={mp.photo_url}
                alt={`${mp.first_name} ${mp.last_name}`}
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-border-base shadow-lg relative z-10 transition-transform hover:scale-[1.02] duration-500"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <h1 className="text-3xl md:text-5xl font-black text-primary mb-4 tracking-tight">
                {mp.first_name} {mp.last_name}
              </h1>

              <div className="flex flex-wrap gap-2 mb-6">
                <span
                  className="px-3 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-sm"
                  style={{ backgroundColor: getPartyHexColor(mp.club) }}
                >
                  {mp.club}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-page/50 text-secondary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 border border-border-base transition-colors hover:bg-page">
                  <MapPin size={12} />
                  Okręg {mp.district}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-page/50 text-secondary text-[10px] font-black uppercase tracking-widest border border-border-base transition-colors hover:bg-page">
                  {mp.term === 9 ? 'IX' : 'X'} Kadencja
                </span>
              </div>

              {/* Badges Row (New!) */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 p-4 bg-page/30 rounded-2xl border border-border-base/30 backdrop-blur-sm">
                  <span className="text-[10px] uppercase font-black tracking-widest text-secondary/50 w-full mb-1">Odznaki Systemowe:</span>
                  {badges.map((badge: string) => (
                    <span key={badge} className="inline-flex items-center px-3 py-1 rounded-lg bg-accent-blue/5 text-accent-blue text-[10px] font-black uppercase tracking-widest border border-accent-blue/10 shadow-sm transition-all hover:bg-accent-blue/10" title="Ta odznaka została przyznana automatycznie na podstawie analizy aktywności">
                      {badge === 'Prymus Głosowań' && '🎓 Prymus'}
                      {badge === 'Lokalny Patriota' && '🏡 Lokalny Patriota'}
                      {badge === 'Specjalizacja Sektorowa' && '⚙️ Ekspert'}
                      {badge === 'Niezależny' && '🤘 Niezależny'}
                      {badge === 'Śledczy' && '🔍 Śledczy'}
                      {!['Prymus Głosowań', 'Lokalny Patriota', 'Specjalizacja Sektorowa', 'Niezależny', 'Śledczy'].includes(badge) && badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 border-t border-border-base/50 pt-6">
                <div className="text-center group">
                  <div className={`text-2xl md:text-4xl font-black transition-transform group-hover:scale-110 ${attendance >= 90 ? 'text-emerald-500' : attendance >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                    {attendance}%
                  </div>
                  <div className="text-[10px] text-secondary uppercase tracking-[0.2em] font-black mt-1">Frekwencja</div>
                </div>
                <div className="text-center border-x border-border-base/50 group">
                  <div className="text-2xl md:text-4xl font-black text-accent-blue transition-transform group-hover:scale-110">{rebelVotes}</div>
                  <div className="text-[10px] text-secondary uppercase tracking-[0.2em] font-black mt-1">Buntów</div>
                </div>
                <div className="text-center group">
                  <div className="text-2xl md:text-4xl font-black text-indigo-400 transition-transform group-hover:scale-110">{interpellationCount}</div>
                  <div className="text-[10px] text-secondary uppercase tracking-[0.2em] font-black mt-1">Interpelacji</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >

            {/* Key Votes Section */}
            {keyVotes && keyVotes.length > 0 && (
              <div className="bg-surface rounded-2xl border-2 border-indigo-500/20 overflow-hidden shadow-md">
                <div className="p-5 border-b border-border-base flex items-center justify-between bg-indigo-500/5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="text-indigo-500" size={20} />
                    <h2 className="text-lg font-bold text-primary">Kluczowe Głosowania</h2>
                  </div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">Ważne decyzje</span>
                </div>

                <div className="divide-y divide-border-base">
                  {keyVotes.map((item, index) => (
                    <Link
                      key={index}
                      to={`/glosowania/${item.votes.term}/${item.votes.sitting}/${item.votes.voting_number}`}
                      className="flex items-center gap-4 p-5 hover:bg-indigo-500/5 transition-colors group"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${item.vote === 'YES' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        item.vote === 'NO' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' :
                          item.vote === 'ABSTAIN' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                            'bg-black/5 dark:bg-white/5 text-secondary border border-border-base'
                        }`}>
                        {item.vote === 'YES' && <CheckCircle2 size={24} />}
                        {item.vote === 'NO' && <XCircle size={24} />}
                        {item.vote === 'ABSTAIN' && <MinusCircle size={24} />}
                        {item.vote === 'ABSENT' && <HelpCircle size={24} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-primary text-sm font-bold line-clamp-2 group-hover:text-indigo-500 transition-colors mb-1 leading-tight">
                          {cleanSejmTitle(item.votes.title_clean || item.votes.title_raw || '')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-secondary text-[10px] uppercase font-bold tracking-tighter">
                            {new Date(item.votes.date).toLocaleDateString('pl-PL')}
                          </span>
                          <span className="text-secondary opacity-30 text-xs">•</span>
                          <span className="text-secondary text-[10px] uppercase font-bold tracking-tighter">
                            Posiedzenie {item.votes.sitting}, Głosowanie {item.votes.voting_number}
                          </span>
                          <span className="text-secondary opacity-30 text-xs">•</span>
                          {/* Vote Type Badge */}
                          <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${item.isFinal ? 'bg-accent-blue/10 text-accent-blue' : 'bg-black/5 dark:bg-white/5 text-secondary'}`}>
                            {item.isFinal ? 'Głosowanie nad całością' : 'Wniosek / Poprawka'}
                          </span>
                          <span className="text-secondary opacity-30 text-xs">•</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${item.vote === 'YES' ? 'text-emerald-500' : item.vote === 'NO' ? 'text-rose-500' : 'text-amber-500'}`}>
                            {item.vote === 'YES' ? 'ZA' : item.vote === 'NO' ? 'PRZECIW' : item.vote === 'ABSTAIN' ? 'WSTRZYMAŁ SIĘ' : 'NIEOBECNY'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-secondary opacity-30 group-hover:opacity-100 group-hover:text-accent-blue group-hover:translate-x-1 shrink-0 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Votes */}
            <div className="bg-surface rounded-2xl border border-border-base overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border-base flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <h2 className="text-lg font-bold text-primary">Ostatnie Głosowania</h2>
              </div>

              {voteHistory.length > 0 ? (
                <div className="divide-y divide-border-base">
                  {voteHistory.slice(0, 5).map((item, index) => (
                    <Link
                      key={index}
                      to={`/glosowania/${item.votes.term}/${item.votes.sitting}/${item.votes.voting_number}`}
                      className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.vote === 'YES' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        item.vote === 'NO' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                          item.vote === 'ABSTAIN' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                            'bg-black/5 dark:bg-white/10 text-secondary'
                        }`}>
                        {item.vote === 'YES' && <CheckCircle2 size={18} />}
                        {item.vote === 'NO' && <XCircle size={18} />}
                        {item.vote === 'ABSTAIN' && <MinusCircle size={18} />}
                        {item.vote === 'ABSENT' && <HelpCircle size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-primary text-sm font-medium line-clamp-1 group-hover:text-blue-500 transition-colors mb-1">
                          {cleanSejmTitle(item.votes.title_clean || item.votes.title_raw || '')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-secondary text-[10px] uppercase font-bold tracking-tighter">
                            {new Date(item.votes.date).toLocaleDateString('pl-PL')}
                          </span>
                          <span className="text-secondary opacity-30 text-xs hidden sm:inline">•</span>
                          <span className="text-secondary text-[10px] uppercase font-bold tracking-tighter hidden sm:inline">
                            Posiedzenie {item.votes.sitting}, Głosowanie {item.votes.voting_number}
                          </span>
                          {/* Vote Type Badge */}
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ml-auto sm:ml-0 ${item.isFinal ? 'bg-accent-blue/10 text-accent-blue' : 'bg-black/5 dark:bg-white/5 text-secondary'}`}>
                            {item.isFinal ? 'Całość' : 'Poprawka'}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-secondary opacity-30 group-hover:opacity-100 group-hover:text-blue-500 shrink-0 transition-all" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-secondary text-sm">
                  Brak danych o głosowaniach
                </div>
              )}

              <Link
                to={`/glosowania?mp_id=${mp.id}`}
                className="block w-full p-4 text-center text-sm font-bold text-blue-500 hover:text-blue-600 border-t border-border-base transition-colors hover:bg-blue-500/5"
              >
                Zobacz pełną historię głosowań ↓
              </Link>
            </div>

            {/* Recent Speeches */}
            <div className="bg-surface rounded-2xl border border-border-base overflow-hidden shadow-sm">
              <div className="p-5 border-b border-border-base flex items-center gap-3">
                <MessageSquare className="text-blue-500" size={20} />
                <h2 className="text-lg font-bold text-primary">Ostatnie Wypowiedzi</h2>
              </div>

              {recentSpeeches.length > 0 ? (
                <div className="divide-y divide-border-base">
                  {recentSpeeches.slice(0, 3).map((speech) => (
                    <Link
                      key={speech.id}
                      to={`/wypowiedzi/${speech.id}`}
                      className="block p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group/speech"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider group-hover/speech:text-blue-500 transition-colors">
                          Posiedzenie {speech.sitting}
                        </span>
                        <span className="text-secondary opacity-30">•</span>
                        <span className="text-[10px] text-secondary">{speech.date}</span>
                      </div>
                      <p className="text-secondary/80 text-sm italic line-clamp-2 group-hover/speech:text-primary transition-colors">
                        "{speech.content?.substring(0, 150)}..."
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-secondary text-sm">
                  Brak zarejestrowanych wypowiedzi
                </div>
              )}

              <Link to="/wypowiedzi" className="block p-4 text-center text-sm font-bold text-blue-500 hover:text-blue-600 border-t border-border-base transition-colors">
                Przeszukaj stenogramy →
              </Link>
            </div>
          </motion.div>

          {/* Right Column - Stats & Declarations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Top 3 Priorities (New!) */}
            {topPriorities.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border-base p-5 shadow-sm">
                <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-pink-500" />
                  Główne Priorytety
                </h3>
                <div className="space-y-2">
                  {topPriorities.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-black/5 dark:bg-white/5 rounded-lg border border-border-base">
                      <span className="text-xs font-bold text-primary">{item.topic}</span>
                      <span className="text-[10px] font-black text-secondary bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ideological Twins (New!) */}
            {(ideologicalTwin || oppositionTwin) && (
              <div className="bg-surface rounded-2xl border border-border-base p-5 shadow-sm">
                <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <Users size={16} className="text-violet-500" />
                  Powiązania
                </h3>
                <div className="space-y-3">
                  {ideologicalTwin && ideologicalTwin.mp_target && (
                    <div className="p-3 bg-violet-500/5 rounded-xl border border-violet-500/20">
                      <div className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-2">Bliźniak Ideowy</div>
                      <Link to={`/poslowie/${ideologicalTwin.mp_target.slug || ideologicalTwin.mp_target.id}`} className="flex items-center gap-3 group">
                        <img src={ideologicalTwin.mp_target.photo_url} className="w-10 h-10 rounded-full object-cover border border-border-base" />
                        <div>
                          <div className="text-sm font-bold text-primary group-hover:text-violet-500 transition-colors">{ideologicalTwin.mp_target.first_name} {ideologicalTwin.mp_target.last_name}</div>
                          <div className="text-[10px] font-bold" style={{ color: getPartyHexColor(ideologicalTwin.mp_target.club) }}>{ideologicalTwin.mp_target.club}</div>
                        </div>
                      </Link>
                    </div>
                  )}
                  {oppositionTwin && oppositionTwin.mp_target && (
                    <div className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/20">
                      <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Bliźniak Opozycyjny</div>
                      <Link to={`/poslowie/${oppositionTwin.mp_target.slug || oppositionTwin.mp_target.id}`} className="flex items-center gap-3 group">
                        <img src={oppositionTwin.mp_target.photo_url} className="w-10 h-10 rounded-full object-cover border border-border-base" />
                        <div>
                          <div className="text-sm font-bold text-primary group-hover:text-orange-500 transition-colors">{oppositionTwin.mp_target.first_name} {oppositionTwin.mp_target.last_name}</div>
                          <div className="text-[10px] font-bold" style={{ color: getPartyHexColor(oppositionTwin.mp_target.club) }}>{oppositionTwin.mp_target.club}</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Activity Stats */}
            <div className="bg-surface rounded-2xl border border-border-base p-5 shadow-sm">
              {/* ... Rest of stats ... */}              <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                Statystyki Aktywności
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-secondary">Frekwencja</span>
                    <span className="text-xs font-bold text-primary">{attendance}%</span>
                  </div>
                  <div className="h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden border border-border-base">
                    <div
                      className={`h-full rounded-full ${attendance >= 90 ? 'bg-emerald-500' : attendance >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${attendance}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-border-base">
                    <div className="text-xl font-black text-accent-blue">{rebelVotes}</div>
                    <div className="text-[9px] text-secondary uppercase tracking-wider font-black">Głosów wbrew partii</div>
                  </div>
                  <div className="text-center p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-border-base">
                    <div className="text-xl font-black text-purple-600 dark:text-purple-400">{interpellationCount}</div>
                    <div className="text-[9px] text-secondary uppercase tracking-wider font-black">Interpelacji</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset Declarations */}
            {digitizedDeclarations && digitizedDeclarations.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border-base p-5 shadow-sm">
                <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-amber-500" />
                  Oświadczenia Majątkowe
                </h3>
                <div className="space-y-3">
                  {digitizedDeclarations.map((decl: any) => (
                    <div key={decl.id} className="p-3 bg-page/50 rounded-xl border border-border-base transition-colors hover:bg-page">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-primary">{decl.year?.substring(0, 4)}</span>
                        {decl.file_path && (
                          <a
                            href={decl.file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-[0.2em] transition-colors"
                          >
                            PDF →
                          </a>
                        )}
                      </div>
                      <div className="space-y-1.5 text-xs font-medium">
                        <div className="flex justify-between items-center">
                          <span className="text-secondary">Oszczędności:</span>
                          <span className="text-primary font-black">{decl.parsed_content?.savings?.toLocaleString() || '—'} PLN</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-secondary">Dochód:</span>
                          <span className="text-primary font-black">{decl.parsed_content?.income?.toLocaleString() || '—'} PLN</span>
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
                className="block bg-surface rounded-2xl border border-border-base p-5 hover:border-blue-500 transition-colors group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="text-blue-500" size={20} />
                    <div>
                      <h3 className="text-sm font-bold text-primary">Interpelacje</h3>
                      <p className="text-xs text-secondary">{interpellationCount} złożonych</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-secondary opacity-30 group-hover:opacity-100 group-hover:text-blue-500 shrink-0 transition-all" />
                </div>
              </Link>
            )}

            {/* Contact & Socials */}
            <div className="bg-surface rounded-2xl border border-border-base p-5 shadow-sm">
              <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                Kontakt i Media
              </h3>

              <div className="space-y-3">
                {/* Social Media Grid */}
                {/* Social Media Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {mp.contact_info?.twitter && (
                    <a href={mp.contact_info.twitter} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all group border border-border-base">
                      <span className="text-primary font-black text-lg">𝕏</span>
                      <span className="text-[9px] mt-1 text-secondary font-black uppercase tracking-widest">Twitter</span>
                    </a>
                  )}
                  {mp.contact_info?.facebook && (
                    <a href={mp.contact_info.facebook} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-all group border border-border-base">
                      <span className="text-primary font-bold text-lg">fb</span>
                      <span className="text-[9px] mt-1 text-secondary font-black uppercase tracking-widest">Facebook</span>
                    </a>
                  )}
                </div>

                {/* Email */}
                <a href={`mailto:${mp.email || 'biuro@sejm.pl'}`} className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-accent-blue/10 transition-colors group border border-border-base">
                  <Mail size={16} className="text-secondary group-hover:text-accent-blue transition-colors" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-secondary uppercase font-black leading-none mb-1">Email</div>
                    <div className="text-sm text-primary font-black truncate">{mp.email || 'biuro@sejm.pl'}</div>
                  </div>
                </a>

                {/* Offices */}
                {mp.contact_info?.offices && mp.contact_info.offices.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[10px] text-secondary uppercase font-bold mb-2">Biura Poselskie</div>
                    <div className="space-y-2">
                      {mp.contact_info.offices.map((office, idx) => (
                        <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-border-base text-xs font-medium">
                          <div className="text-primary font-black mb-1">{office.address}</div>
                          {office.phone && <div className="text-secondary text-[10px]">{office.phone}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MpProfile;
