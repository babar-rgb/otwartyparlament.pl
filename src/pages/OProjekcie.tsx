import { Heart, Github, Book, Lock, Zap, Users, Target, Calendar, CheckCircle2 } from 'lucide-react';
import SEO from '../components/SEO';

export default function OProjekcie() {
  return (
    <div className="min-h-screen bg-[#06060c] pt-24 pb-12 px-4 animate-fade-in">
      <SEO
        title="O Projekcie"
        description="Otwarty Parlament to niezależne narzędzie do analizy pracy Sejmu. Sprawdź, jak głosują Twoi posłowie."
      />

      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full font-bold text-xs uppercase tracking-widest mb-8 border border-blue-500/20">
            <Target size={14} />
            <span>Misja: Przejrzystość</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
            Wiedza to władza. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Odzyskaj ją.</span>
          </h1>
          <p className="text-xl text-white/50 max-w-3xl mx-auto leading-relaxed font-medium">
            Sejm to nie zamknięta twierdza. Stworzyliśmy to narzędzie, abyś nie musiał wierzyć politykom na słowo – teraz możesz sprawdzić ich czyny. Szybko, prosto i bez lania wody.
          </p>
        </div>

        {/* Core Values Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-24">
          <div className="bg-[#111126] p-8 rounded-[2rem] border border-white/5 shadow-2xl hover:bg-[#16162d] transition-all group">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
              <Zap size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Po ludzku</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Prawniczy bełkot zamieniamy na proste fakty. Nie musisz kończyć prawa, żeby wiedzieć, czy posłowie podnoszą Ci podatki, czy je obniżają.
            </p>
          </div>

          <div className="bg-[#111126] p-8 rounded-[2rem] border border-white/5 shadow-2xl hover:bg-[#16162d] transition-all group">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
              <Lock size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Prywatność</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              Nie interesuje nas kim jesteś. Nie ma tu ciasteczek śledzących, reklam ani ukrytych skryptów. Tylko czyste dane. Jesteś u siebie.
            </p>
          </div>

          <div className="bg-[#111126] p-8 rounded-[2rem] border border-white/5 shadow-2xl hover:bg-[#16162d] transition-all group">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 transition-transform">
              <Heart size={28} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Niezależność</h3>
            <p className="text-white/50 leading-relaxed text-sm">
              To projekt robiony "po godzinach". Nie stoi za nami żadna partia, korporacja ani fundusz. Dzięki temu możemy pisać prawdę, nawet te niewygodną.
            </p>
          </div>
        </div>

        {/* How It Works - Visual Section */}
        <div className="mb-24">
          <div className="bg-gradient-to-b from-[#111126] to-[#0c0c1a] rounded-[2.5rem] p-8 md:p-12 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="relative z-10">
              <div className="text-center mb-16">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 block">Architektura Systemu</span>
                <h2 className="text-3xl md:text-5xl font-black text-white">Jak to działa?</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-12 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0"></div>

                <div className="text-center relative">
                  <div className="w-16 h-16 bg-[#06060c] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 relative z-10 shadow-xl">
                    <Book size={24} className="text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">1. Pobieramy dane</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Synchronizacja z API Sejmu RP w czasie rzeczywistym.
                  </p>
                </div>

                <div className="text-center relative">
                  <div className="w-16 h-16 bg-[#06060c] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 relative z-10 shadow-xl">
                    <Users size={24} className="text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">2. Analizujemy AI</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    LLM analizują treść ustaw i wykrywają kluczowe zmiany.
                  </p>
                </div>

                <div className="text-center relative">
                  <div className="w-16 h-16 bg-[#06060c] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10 relative z-10 shadow-xl">
                    <Zap size={24} className="text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">3. Prezentujemy</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Dostajesz czytelne rankingi, wykresy i podsumowania.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-24">
          <h2 className="text-3xl font-black text-white mb-10 text-center">Plan rozwoju</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Current Phase */}
            <div className="bg-[#111126] rounded-[2rem] p-8 border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl">
                Obecnie
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-blue-400" size={24} />
                <h3 className="text-xl font-bold text-white">Q4 2025</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Wdrożenie pełnej bazy posłów i klubów',
                  'Analiza AI dla kluczowych ustaw',
                  'System powiadomień i Newsletter'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Future Phase */}
            <div className="bg-white/[0.02] rounded-[2rem] p-8 border border-white/5 hover:bg-white/[0.04] transition-colors">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-white/10 text-white/40 text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl">
                Wkrótce
              </div>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="text-white/20" size={24} />
                <h3 className="text-xl font-bold text-white/40">2026</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Aplikacja mobilna (iOS/Android)',
                  'Porównywarka poglądów (Komparator v2)',
                  'Publiczne API dla deweloperów'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full border-2 border-white/10 mt-0.5 flex-shrink-0"></div>
                    <span className="text-white/40 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Compliance Section */}
        <div className="mb-24 bg-[#111126] rounded-[2rem] p-8 border border-white/5 flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0 p-4 bg-emerald-500/10 rounded-2xl text-emerald-400">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-4 text-sm text-white/50 leading-relaxed md:border-l border-white/5 md:pl-8">
            <p>
              <strong>Legalność:</strong> Dane pochodzą z Systemu Informacyjnego Sejmu (api.sejm.gov.pl) i są wykorzystywane zgodnie z ustawą o otwartych danych (Dz.U. 2023 poz. 1524).
            </p>
            <p>
              <strong>AI Disclaimer:</strong> Opisy i analizy głosowań są generowane automatycznie przez modele językowe i nie stanowią oficjalnego stanowiska Kancelarii Sejmu.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-[#111126] to-[#0a0a16] rounded-[3rem] p-12 text-center border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white mb-4">Dołącz do ruchu</h2>
            <p className="text-white/50 mb-10 max-w-xl mx-auto">
              To projekt społeczny open-source. Twój głos i Twoje wsparcie mają znaczenie.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="https://github.com/babar-rgb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#06060c] rounded-xl font-bold hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
              >
                <Github size={20} />
                Współtwórz kod
              </a>
              <a
                href="mailto:kontakt@otwartyparlament.pl"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                <Heart size={20} className="text-rose-400" />
                Zostań patronem
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
