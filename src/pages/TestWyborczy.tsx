import { useState, useEffect } from 'react';
import { ChevronLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import realVotesData from '../data/realTestVotes.json';

// Party colors mapping
const PARTY_COLORS: Record<string, string> = {
  'PiS': '#1e3a8a',
  'KO': '#ea580c',
  'Polska2050': '#eab308',
  'PSL-TD': '#16a34a',
  'Lewica': '#dc2626',
  'Konfederacja': '#0a1628',
  'Razem': '#9333ea',
  'Kukiz15': '#334155',
};

const PARTY_NAMES: Record<string, string> = {
  'PiS': 'Prawo i Sprawiedliwość',
  'KO': 'Koalicja Obywatelska',
  'Polska2050': 'Polska 2050',
  'PSL-TD': 'Polskie Stronnictwo Ludowe',
  'Lewica': 'Lewica',
  'Konfederacja': 'Konfederacja',
  'Razem': 'Partia Razem',
};

interface TestVote {
  vote_id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  party_stances: Record<string, string>;
}

export default function TestWyborczy() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [testVotes, setTestVotes] = useState<TestVote[]>([]);

  useEffect(() => {
    // Load data (in a real app, this might be an API call, but importing JSON is fine here)
    // Filter out votes where parties are mostly mixed or absent to ensure quality
    const validVotes = (realVotesData as TestVote[]).filter(v =>
      Object.values(v.party_stances).some(s => s !== 'MIXED' && s !== 'ABSENT')
    ).slice(0, 10); // Limit to 10 questions

    setTestVotes(validVotes);
  }, []);

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
    if (currentQuestion < testVotes.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  if (testVotes.length === 0) {
    return <div className="text-center py-24">Ładowanie testu...</div>;
  }

  if (showResults) {
    // Calculate alignment
    const parties = Object.keys(PARTY_COLORS).filter(p =>
      testVotes.some(v => v.party_stances[p] && v.party_stances[p] !== 'ABSENT')
    );

    const partyAlignments = parties.map((party) => {
      let score = 0;
      let maxScore = 0;

      testVotes.forEach((vote, idx) => {
        const userAnswer = answers[idx]; // 'YES', 'NO', 'ABSTAIN'
        const partyStance = vote.party_stances[party];

        if (userAnswer && partyStance && partyStance !== 'ABSENT' && partyStance !== 'MIXED') {
          maxScore++;
          if (userAnswer === partyStance) {
            score++;
          } else if (userAnswer === 'ABSTAIN' || partyStance === 'ABSTAIN') {
            score += 0.5; // Partial credit for abstaining
          }
        }
      });

      return {
        party,
        name: PARTY_NAMES[party] || party,
        alignment: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
        color: PARTY_COLORS[party] || '#666',
      };
    });

    const sortedParties = partyAlignments.sort((a, b) => b.alignment - a.alignment);
    const bestMatch = sortedParties[0];

    return (
      <div className="space-y-8 max-w-2xl mx-auto pt-24 pb-12 px-4 animate-fade-in">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Twoje wyniki</h1>
          <p className="text-slate-700 mb-6">
            Na podstawie Twoich odpowiedzi w rzeczywistych głosowaniach:
          </p>

          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8 shadow-sm">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-3xl shadow-md"
              style={{ backgroundColor: bestMatch.color }}
            >
              {bestMatch.party.substring(0, 3)}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{bestMatch.name}</h2>
            <p className="text-4xl font-black text-green-600 mb-2">{bestMatch.alignment}%</p>
            <p className="text-slate-500 font-medium">zgodności poglądów</p>
          </div>

          <div className="space-y-3 mb-8 text-left">
            <h3 className="font-bold text-slate-900 text-lg mb-4 ml-1">Pozostałe partie</h3>
            {sortedParties.slice(1).map((item, idx) => (
              <div key={item.party} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-bold w-6">{idx + 2}.</span>
                  <span className="font-semibold text-slate-900">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 md:w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${item.alignment}%`,
                        backgroundColor: item.color,
                      }}
                    ></div>
                  </div>
                  <span className="font-bold text-slate-900 min-w-12 text-right">{item.alignment}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 text-left flex gap-3">
            <AlertTriangle className="text-blue-600 shrink-0" />
            <p className="text-sm text-slate-700">
              <strong>Uwaga:</strong> Ten test opiera się na surowych danych z głosowań. Czasami partie głosują "przeciw" z powodów proceduralnych lub poprawek, nawet jeśli popierają ogólną ideę. Wynik jest orientacyjny.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Rozwiąż ponownie
          </button>
        </div>
      </div>
    );
  }

  const vote = testVotes[currentQuestion];
  const progress = ((currentQuestion + 1) / testVotes.length) * 100;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 animate-fade-in">
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-black text-slate-900 mb-3">Sejmowy Kompas</h1>
          <p className="text-lg text-slate-600">
            Sprawdź, jak zagłosowałbyś w prawdziwych sprawach i zobacz, kto Cię reprezentuje.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Progress Bar */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Głosowanie {currentQuestion + 1} / {testVotes.length}
              </p>
              <p className="text-xs font-bold text-blue-600">{Math.round(progress)}%</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold mb-3 border border-slate-200">
                {vote.category}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4 leading-tight">
                {vote.title}
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
                "{vote.description}"
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleAnswer('YES')}
                className="w-full p-5 text-left border-2 border-slate-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-green-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-green-700 text-lg">Jestem ZA</span>
                </div>
              </button>

              <button
                onClick={() => handleAnswer('NO')}
                className="w-full p-5 text-left border-2 border-slate-100 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-red-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-red-700 text-lg">Jestem PRZECIW</span>
                </div>
              </button>

              <button
                onClick={() => handleAnswer('ABSTAIN')}
                className="w-full p-5 text-left border-2 border-slate-100 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-yellow-500 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-yellow-700 text-lg">Wstrzymuję się / Nie mam zdania</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <ChevronLeft size={18} />
              Poprzednie
            </button>
            <div className="text-xs text-slate-400 font-medium">
              Data głosowania: {new Date(vote.date).toLocaleDateString('pl-PL')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
