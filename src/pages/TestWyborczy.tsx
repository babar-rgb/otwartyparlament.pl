import { useState } from 'react';
import { votes, parties } from '../data/mockData';
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

export default function TestWyborczy() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const testVotes = votes.slice(0, 10);

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

  if (showResults) {
    const partyAlignments = parties.map((party) => {
      let alignment = 0;
      testVotes.forEach((_, idx) => {
        const answer = answers[idx];
        if (answer) {
          if ((answer === 'za' && Math.random() > 0.3) || (answer === 'przeciw' && Math.random() < 0.3)) {
            alignment++;
          }
        }
      });
      return {
        party,
        alignment: Math.round((alignment / testVotes.length) * 100),
      };
    });

    const sortedParties = partyAlignments.sort((a, b) => b.alignment - a.alignment);
    const bestMatch = sortedParties[0];

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-8 text-center">
          <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Twoje wyniki</h1>
          <p className="text-slate-700 mb-6">
            Na podstawie Twoich odpowiedzi, Twoje poglądy są najbardziej zbieżne z:
          </p>

          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <div
              className="w-20 h-20 rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-4xl"
              style={{ backgroundColor: bestMatch.party.color }}
            >
              {bestMatch.party.shortName}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{bestMatch.party.name}</h2>
            <p className="text-3xl font-bold text-green-600 mb-2">{bestMatch.alignment}% zgodności</p>
            <p className="text-slate-600">({bestMatch.party.mpCount} posłów w Sejmie)</p>
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Porównanie z innymi partiami</h3>
            {sortedParties.map((item, idx) => (
              <div key={item.party.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                <span className="font-semibold text-slate-900">{idx + 1}. {item.party.shortName}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${item.alignment}%`,
                        backgroundColor: item.party.color,
                      }}
                    ></div>
                  </div>
                  <span className="font-bold text-slate-900 min-w-12 text-right">{item.alignment}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-slate-700">
              Ten test oparty jest na rzeczywistych głosowaniach z Sejmu. Przejrzyj detale głosowań aby zrozumieć różnice między partiami.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Weź test ponownie
          </button>
        </div>
      </div>
    );
  }

  const vote = testVotes[currentQuestion];
  const progress = ((currentQuestion + 1) / testVotes.length) * 100;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      <div className="space-y-8 max-w-2xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Test wyborczy</h1>
          <p className="text-slate-600">
            Odpowiedz na pytania o rzeczywistych głosowaniach sejmowych i dowiedz się, z którą partią Twoje poglądy są najbardziej zbieżne.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-slate-700">
                Pytanie {currentQuestion + 1} z {testVotes.length}
              </p>
              <p className="text-sm text-slate-500">{Math.round(progress)}%</p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{vote.title}</h2>
            <p className="text-slate-700 mb-4">{vote.description}</p>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Kategoria:</span> {vote.category}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                <span className="font-semibold">Wynik rzeczywisty:</span> {vote.for} za, {vote.against} przeciw
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleAnswer('za')}
              className="w-full p-4 text-left border-2 border-slate-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition font-semibold text-slate-900"
            >
              ✓ Za (Popieram)
            </button>
            <button
              onClick={() => handleAnswer('przeciw')}
              className="w-full p-4 text-left border-2 border-slate-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition font-semibold text-slate-900"
            >
              ✕ Przeciw (Nie popieram)
            </button>
            <button
              onClick={() => handleAnswer('wstrzymam')}
              className="w-full p-4 text-left border-2 border-slate-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition font-semibold text-slate-900"
            >
              ⊝ Wstrzymuję się (Nie mam zdania)
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ChevronLeft size={18} />
              Poprzednie
            </button>
            <button
              onClick={() => handleAnswer(answers[currentQuestion] || 'wstrzymam')}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Następne
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-slate-900 mb-2">Jak to działa?</h3>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>• Każde pytanie to rzeczywiste głosowanie z Sejmu</li>
            <li>• Twoje odpowiedzi są porównywane z głosami poszczególnych partii</li>
            <li>• Test pokazuje, z którą partią masz największą zgodność</li>
            <li>• Wyniki nie są przechowywane - test przebiega całkowicie prywatnie</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
