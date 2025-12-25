import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle2, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useLatarnik } from '../hooks/useLatarnik';
import { Link } from 'react-router-dom';
import { db } from '../lib/db';

// Minimal interface for dynamic party data
interface PartyMetadata {
  id: string;
  name: string;
  color: string;
  logo_url: string;
}

// Default fallback config in case DB fetch fails or for initial render
const FALLBACK_PARTY_CONFIG: Record<string, { color: string, name: string, logo: string }> = {
  'PiS': {
    color: '#0355BF',
    name: 'Prawo i Sprawiedliwość',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Prawo_i_Sprawiedliwo%C5%9B%C4%87_logo.svg/512px-Prawo_i_Sprawiedliwo%C5%9B%C4%87_logo.svg.png'
  },
  'KO': {
    color: '#F26D21',
    name: 'Koalicja Obywatelska',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Koalicja_Obywatelska_logo.svg/512px-Koalicja_Obywatelska_logo.svg.png'
  },
  'Konfederacja': {
    color: '#0a1628',
    name: 'Konfederacja',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Konfederacja_Wolno%C5%9B%C4%87_i_Niepodleg%C5%82o%C5%9B%C4%87_logo.svg/512px-Konfederacja_Wolno%C5%9B%C4%87_i_Niepodleg%C5%82o%C5%9B%C4%87_logo.svg.png'
  },
  'niez.': {
    color: '#6B7280',
    name: 'Niezrzeszeni',
    logo: ''
  },
};

export default function TestWyborczy() {
  const { votes, loading, error, calculateFullResults } = useLatarnik();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [partyConfig, setPartyConfig] = useState<Record<string, { color: string, name: string, logo: string }>>(FALLBACK_PARTY_CONFIG);

  // Fetch party metadata from DB on mount
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const { data } = await db.from('parties').select('*');
        if (data && data.length > 0) {
          const config: Record<string, any> = {};
          data.forEach((p: PartyMetadata) => {
            config[p.id] = {
              color: p.color,
              name: p.name,
              logo: p.logo_url
            };
          });
          setPartyConfig(config);
        }
      } catch (err) {
        console.error("Failed to fetch party metadata from DB:", err);
      }
    };
    fetchParties();
  }, []);

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...userAnswers, [votes[currentQuestion].id]: answer };
    setUserAnswers(newAnswers);

    if (currentQuestion < votes.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setCalculating(true);
      try {
        const res = await calculateFullResults(newAnswers);
        setResults(res);
      } catch (err) {
        console.error("Calculation error:", err);
      }
      setCalculating(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(prev => prev - 1);
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setUserAnswers({});
    setResults(null);
  };

  if (loading || calculating) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-black text-primary animate-pulse">
          {calculating ? 'Analizowanie Twoich poglądów...' : 'Przygotowywanie Sejmowego Kompasu...'}
        </h2>
        <p className="text-secondary mt-2">Dopasowujemy Twoje odpowiedzi do realnych głosowań Sejmu X kadencji.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-primary">Coś poszło nie tak</h2>
        <p className="text-secondary mt-2 max-w-md">{error}</p>
        <p className="text-xs text-secondary/50 mt-1">Upewnij się, że baza danych jest dostępna.</p>
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Spróbuj ponownie</button>
      </div>
    );
  }

  if (results) {
    if (!results.parties || results.parties.length === 0) {
      return (
        <div className="min-h-screen bg-page flex flex-col items-center justify-center p-4 text-center">
          <AlertTriangle size={48} className="text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-primary">Brak danych do dopasowania</h2>
          <p className="text-secondary mt-2 max-w-md">
            Niestety nie udało się obliczyć Twojego dopasowania. Może to być spowodowane brakiem danych głosowań dla wybranych pytań.
          </p>
          <button onClick={handleReset} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Spróbuj ponownie</button>
        </div>
      );
    }

    const bestMatch = results.parties[0];

    return (
      <div className="min-h-screen bg-page pt-32 pb-24 px-4 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border-base rounded-[2.5rem] p-8 md:p-12 text-center shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-cyan-400" />
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-black text-primary mb-4">Twój Wynik</h1>
            <p className="text-secondary text-lg mb-10">Najbliżej Ci do poglądów reprezentowanych przez:</p>

            <div className="flex flex-col items-center">
              <div className="bg-page/50 rounded-3xl p-10 border border-border-base w-full max-w-xl flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-3xl mx-auto mb-6 flex items-center justify-center bg-white shadow-lg p-4 overflow-hidden">
                  {partyConfig[bestMatch.party]?.logo ? (
                    <img
                      src={partyConfig[bestMatch.party].logo}
                      alt={bestMatch.party}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.img-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'img-fallback w-full h-full flex items-center justify-center text-white font-black text-3xl';
                          fallback.style.backgroundColor = partyConfig[bestMatch.party]?.color || '#444';
                          fallback.innerText = bestMatch?.party?.substring(0, 3) || '???';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white font-black text-3xl"
                      style={{ backgroundColor: (bestMatch && bestMatch.party && partyConfig[bestMatch.party]?.color) || '#444' }}
                    >
                      {bestMatch?.party?.substring(0, 3) || '???'}
                    </div>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-primary mb-2 line-clamp-1">{(bestMatch && partyConfig[bestMatch.party]?.name) || bestMatch?.party || 'Nieznana Partia'}</h2>
                <div className="flex items-center gap-3">
                  <p className="text-5xl font-black text-emerald-500">{bestMatch?.alignment || 0}%</p>
                  <div className="h-10 w-px bg-border-base" />
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest text-left leading-tight">Zgodności<br />programowej</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* All Parties Ranking */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-8 ml-2">
              <TrendingUp className="text-blue-500" />
              <h2 className="text-2xl font-black text-primary">Pełny Ranking Partii</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.parties.map((item: any, idx: number) => (
                <div key={item.party} className="flex items-center justify-between p-5 bg-surface border border-border-base rounded-2xl hover:border-blue-500/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <span className="text-secondary font-black opacity-20 text-xl w-6 text-center">{idx + 1}.</span>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm p-1.5 overflow-hidden relative">
                      {partyConfig[item.party]?.logo ? (
                        <img
                          src={partyConfig[item.party].logo}
                          alt={item.party}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.img-fallback')) {
                              const fallback = document.createElement('div');
                              fallback.className = 'img-fallback w-full h-full flex items-center justify-center text-white font-bold text-[8px]';
                              fallback.style.backgroundColor = partyConfig[item.party]?.color || '#666';
                              fallback.innerText = item.party.substring(0, 3);
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-white font-bold text-[8px]"
                          style={{ backgroundColor: partyConfig[item.party]?.color || '#666' }}
                        >
                          {item.party.substring(0, 3)}
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-primary truncate max-w-[150px] md:max-w-[200px]">{partyConfig[item.party]?.name || item.party}</span>
                  </div>
                  <span className="font-black text-primary text-lg">{item.alignment}%</span>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center pt-12 space-x-4">
            <button onClick={handleReset} className="px-8 py-3 bg-surface border border-border-base text-primary rounded-xl font-bold hover:bg-page transition">Rozwiąż ponownie</button>
            <Link to="/" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg inline-block">Wróć do pulpitu</Link>
          </div>
        </div>
      </div>
    );
  }

  const currentVote = votes[currentQuestion];
  const progress = ((currentQuestion + 1) / votes.length) * 100;

  return (
    <div className="min-h-screen bg-page pt-32 pb-24 px-4 overflow-x-hidden">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="max-w-[80%]">
              <p className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Głosowanie {currentQuestion + 1} z {votes.length}</p>
              <h1 className="text-3xl font-black text-primary leading-tight">Sejmowy Kompas</h1>
            </div>
            <p className="text-2xl font-black text-primary opacity-20">{Math.round(progress)}%</p>
          </div>
          <div className="h-2 bg-border-base rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-surface border border-border-base rounded-[2rem] p-8 md:p-10 shadow-xl relative"
          >
            <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest text-blue-500/60 bg-blue-500/5 w-fit px-3 py-1 rounded-full border border-blue-500/10">
              <Info size={12} />
              TEMAT: {currentVote.topic}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6 leading-tight">
              {currentVote.title}
            </h2>

            <div className="p-6 bg-page/50 rounded-2xl border border-border-base mb-10 overflow-hidden">
              <p className="text-secondary text-base leading-relaxed italic line-clamp-4 hover:line-clamp-none transition-all cursor-help" title={currentVote.description}>
                "{currentVote.description}"
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'YES', label: 'Jestem ZA', color: 'emerald' },
                { id: 'NO', label: 'Jestem PRZECIW', color: 'rose' },
                { id: 'ABSTAIN', label: 'Nie mam zdania', color: 'amber' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(opt.id)}
                  className={`group flex items-center justify-between p-6 bg-page/30 border-2 border-border-base rounded-2xl hover:border-blue-500/40 hover:bg-page transition-all text-left transform active:scale-[0.98]`}
                >
                  <span className={`text-xl font-bold text-primary group-hover:text-blue-600 transition-colors`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-border-base text-center">
              <Link
                to={`/glosowania/${currentVote.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-xs font-bold text-secondary hover:text-blue-500 transition-colors uppercase tracking-widest"
              >
                <Info size={14} />
                Zobacz szczegóły tego głosowania w archiwum
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 text-secondary font-bold hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft size={20} /> Wróć
          </button>
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-40 text-right max-w-[200px]">
            Pytania dobrane pod kątem największych kontrowersji w Sejmie X Kadencji
          </p>
        </div>
      </div>
    </div>
  );
}
