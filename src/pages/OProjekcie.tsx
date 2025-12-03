import { Heart, Github, Book, Lock, Zap, Users, Target, Calendar, CheckCircle2 } from 'lucide-react';

export default function OProjekcie() {
  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl animate-fade-in">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-bold text-sm mb-6 border border-blue-100">
          <Target size={16} />
          <span>Nasza Misja</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
          Demokracja potrzebuje <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">światła</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Wierzymy, że przejrzystość jest fundamentem zaufania. Budujemy narzędzia, które pozwalają każdemu obywatelowi zrozumieć, co dzieje się przy ulicy Wiejskiej.
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-24">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow group">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
            <Zap size={28} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Dostępność</h3>
          <p className="text-slate-600 leading-relaxed">
            Zamieniamy skomplikowany język prawniczy na proste podsumowania. Dane sejmowe powinny być zrozumiałe dla każdego, nie tylko dla prawników.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow group">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 text-indigo-600 group-hover:scale-110 transition-transform">
            <Lock size={28} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Bezpieczeństwo</h3>
          <p className="text-slate-600 leading-relaxed">
            Szanujemy Twoją prywatność. Nie śledzimy Cię, nie sprzedajemy danych. Nasz kod jest otwarty, więc możesz to zweryfikować.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-shadow group">
          <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
            <Heart size={28} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Niezależność</h3>
          <p className="text-slate-600 leading-relaxed">
            Jesteśmy inicjatywą non-profit, niezależną od partii politycznych i grup interesu. Naszym jedynym interesariuszem jest społeczeństwo.
          </p>
        </div>
      </div>

      {/* How It Works - Visual Section */}
      <div className="mb-24">
        <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Jak to działa?</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <Book size={32} className="text-blue-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Pobieramy dane</h3>
                <p className="text-slate-400 text-sm">
                  Automatycznie synchronizujemy się z API Sejmu RP, pobierając informacje o głosowaniach i posłach.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <Users size={32} className="text-purple-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. Analizujemy</h3>
                <p className="text-slate-400 text-sm">
                  Nasze algorytmy i AI przetwarzają surowe dane, wykrywając anomalie, bunty partyjne i kluczowe tematy.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                  <Zap size={32} className="text-yellow-300" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Prezentujemy</h3>
                <p className="text-slate-400 text-sm">
                  Dostarczasz Ci czytelne raporty, rankingi i profile, dzięki którym wiesz, kto i jak Cię reprezentuje.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap */}
      <div className="mb-24">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Plan rozwoju</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-blue-600" />
              <h3 className="text-xl font-bold text-slate-900">Q4 2025 (Teraz)</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Wdrożenie pełnej bazy posłów i klubów</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Analiza AI dla kluczowych ustaw</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">Newsletter i system powiadomień</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="text-slate-400" />
              <h3 className="text-xl font-bold text-slate-900">2026 (Przyszłość)</h3>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 flex-shrink-0"></div>
                <span className="text-slate-600">Aplikacja mobilna (iOS/Android)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 flex-shrink-0"></div>
                <span className="text-slate-600">Porównywarka poglądów (Tinder dla polityki)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 mt-0.5 flex-shrink-0"></div>
                <span className="text-slate-600">Publiczne API dla deweloperów</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal Compliance Section */}
      <div className="mb-24 bg-slate-50 rounded-2xl p-8 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 size={24} className="text-green-600" />
          Legalność i Transparentność
        </h3>
        <div className="grid md:grid-cols-2 gap-8 text-sm text-slate-600">
          <div>
            <p className="mb-2">
              <strong>Źródło danych:</strong> Dane pochodzą z Systemu Informacyjnego Sejmu (api.sejm.gov.pl) i są wykorzystywane zgodnie z ustawą o otwartych danych (Dz.U. 2023 poz. 1524).
            </p>
            <p>
              <strong>Aktualizacja:</strong> Dane są pobierane codziennie. Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}.
            </p>
          </div>
          <div>
            <p className="mb-2">
              <strong>Przetwarzanie AI:</strong> Opisy i analizy głosowań są generowane automatycznie przez sztuczną inteligencję i nie stanowią oficjalnego stanowiska Kancelarii Sejmu.
            </p>
            <p className="italic text-xs mt-2">
              Kancelaria Sejmu nie ponosi odpowiedzialności za przetworzone dane.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-12 text-center border border-slate-200">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Dołącz do ruchu</h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          To projekt społeczny. Twój głos, Twój kod i Twoje wsparcie mają znaczenie.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="https://github.com/yourusername/otwartyparlament"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-lg"
          >
            <Github size={20} />
            Współtwórz kod
          </a>
          <a
            href="mailto:kontakt@otwartyparlament.pl"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold hover:border-blue-500 hover:text-blue-600 transition-all"
          >
            <Heart size={20} />
            Zostań patronem
          </a>
        </div>
      </div>
    </div>
  );
}
