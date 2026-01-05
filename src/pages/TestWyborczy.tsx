import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, AlertTriangle, Scale, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLatarnik } from '../hooks/useLatarnik';
import { fetchParties } from '../api';

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
  'Trzecia Droga': {
    color: '#F6B511',
    name: 'Trzecia Droga',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Logo_Trzecia_Droga.svg/512px-Logo_Trzecia_Droga.svg.png'
  },
  'Lewica': {
    color: '#C00000',
    name: 'Lewica',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Nowa_Lewica_logo.svg/512px-Nowa_Lewica_logo.svg.png'
  },
};

export default function TestWyborczy() {
  const { votes, loading, error, calculateFullResults } = useLatarnik();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [partyConfig, setPartyConfig] = useState<Record<string, { color: string, name: string, logo: string }>>(FALLBACK_PARTY_CONFIG);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const loadParties = async () => {
      try {
        const data = await fetchParties();
        if (data && data.length > 0) {
          const config: Record<string, any> = {};
          data.forEach((p: any) => {
            config[p.id] = {
              color: p.color,
              name: p.name,
              logo: p.logo_url
            };
          });
          setPartyConfig(config);
        }
      } catch (err) {
        console.error("Failed to fetch party metadata:", err);
      }
    };
    loadParties();
  }, []);

  const handleStart = () => {
    setHasStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswer = async (answer: string) => {
    const newAnswers = { ...userAnswers, [votes[currentQuestion].id]: answer };
    setUserAnswers(newAnswers);

    if (currentQuestion < votes.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCalculating(true);
      try {
        const res = await calculateFullResults(newAnswers);
        setResults(res);
      } catch (err) {
        console.error("Calculation error:", err);
      }
      setCalculating(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(prev => prev - 1);
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setUserAnswers({});
    setResults(null);
    setHasStarted(false);
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
        <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Spróbuj ponownie</button>
      </div>
    );
  }

  if (!hasStarted && !results) {
    return (
      <div className="min-h-screen bg-page pt-32 pb-24 px-4 overflow-x-hidden flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 font-bold text-sm tracking-widest uppercase mb-4">
              <Scale size={16} />
              Test Prawdy Sejmowej
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tight leading-none">
              Sprawdź swój <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">polityczny DNA</span>
            </h1>
            <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
              Tradycyjne latarniki oparte są na deklaracjach. My sprawdzamy fakty z Sejmu.
            </p>
          </div>
          <div className="pt-8">
            <button onClick={handleStart} className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-full font-black hover:bg-blue-700 transition">
              ZACZNIJ TEST <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (results) {
    const bestMatch = results.parties?.[0];
    if (!bestMatch) return <div>Brak wyników.</div>;

    return (
      <div className="min-h-screen bg-page pt-32 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <h1 className="text-4xl font-black">Twój Wynik</h1>
          <div className="bg-surface p-12 rounded-[2.5rem] border border-border-base shadow-xl">
            <div className="text-6xl font-black text-emerald-500 mb-4">{bestMatch.alignment}%</div>
            <div className="text-2xl font-bold">{partyConfig[bestMatch.party]?.name || bestMatch.party}</div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {results.parties.map((p: any) => (
              <div key={p.party} className="p-6 bg-surface border border-border-base rounded-2xl flex justify-between items-center">
                <span className="font-bold">{partyConfig[p.party]?.name || p.party}</span>
                <span className="font-black text-blue-500">{p.alignment}%</span>
              </div>
            ))}
          </div>
          <button onClick={handleReset} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold">Zacznij od nowa</button>
        </div>
      </div>
    );
  }

  const currentVote = votes[currentQuestion];
  const progress = ((currentQuestion + 1) / votes.length) * 100;

  return (
    <div className="min-h-screen bg-page pt-32 pb-24 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <div className="w-full h-2 bg-border-base rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="bg-surface p-10 rounded-[2rem] border border-border-base shadow-xl">
          <div className="text-xs font-black text-blue-500 uppercase mb-4 tracking-widest">Temat: {currentVote.topic}</div>
          <h2 className="text-2xl font-bold mb-4">{currentVote.title}</h2>

          <p className="text-secondary mb-6 leading-relaxed">
            {currentVote.description}
          </p>

          <Link
            to={`/glosowania/${currentVote.term}/${currentVote.sitting}/${currentVote.voting_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-500 hover:text-blue-600 mb-8 hover:underline"
          >
            Zobacz szczegóły i wyniki głosowania <ExternalLink size={14} />
          </Link>

          <div className="grid gap-4">
            {['YES', 'NO', 'ABSTAIN'].map(val => (
              <button key={val} onClick={() => handleAnswer(val)} className="p-6 bg-page/50 border-2 border-border-base rounded-2xl hover:border-blue-500/40 font-bold text-left transition-all">
                {val === 'YES' ? 'Jestem ZA' : val === 'NO' ? 'Jestem PRZECIW' : 'Nie mam zdania'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handlePrevious} disabled={currentQuestion === 0} className="flex items-center gap-2 text-secondary font-bold hover:text-primary transition-colors disabled:opacity-30">
          <ChevronLeft size={20} /> Wróć
        </button>
      </div>
    </div>
  );
}
