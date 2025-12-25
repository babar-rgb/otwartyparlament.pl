import { Github, Book, Lock, Zap, Users, Target, Calendar, CheckCircle2, FileText } from 'lucide-react';
import SEO from '../components/SEO';

export default function OProjekcie() {
  return (
    <div className="min-h-screen bg-page pt-32 pb-16 px-4 md:px-8 transition-colors duration-300">
      <SEO
        title="O Projekcie"
        description="Misją Otwartego Parlamentu jest zwiększenie przejrzystości procesu legislacyjnego poprzez analityczne podejście do danych publicznych."
      />

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-blue/10 text-accent-blue rounded-full font-bold text-[10px] uppercase tracking-wider mb-6 border border-accent-blue/20">
            <Target size={14} />
            <span>Misja: Cyfrowa Demokracja</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tight leading-tight">
            Technologia w służbie <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 underline decoration-blue-500/20 underline-offset-8">Przejrzystości.</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary max-w-2xl leading-relaxed">
            Otwarty Parlament to niezależna platforma analityczna, która przekształca surowe dane legislacyjne w konkretną wiedzę. Dostarczamy obywatelom narzędzi do obiektywnej weryfikacji pracy Sejmu RP.
          </p>
        </div>

        {/* Strategic Pillars */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-accent-blue">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Dostępność Informacji</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Upraszczamy złożone procesy legislacyjne. Dzięki automatyzacji i analizie AI, skomplikowane projekty ustaw stają się zrozumiałe dla każdego obywatela, bez konieczności posiadania wykształcenia prawniczego.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Prywatność i Bezpieczeństwo</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Wierzymy, że dostęp do informacji publicznej nie powinien wiązać się z utratą prywatności. Nasza platforma jest wolna od skryptów śledzących i systemów reklamowych.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Niezależność Wydawnicza</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Jako projekt typu open-source, nie podlegamy wpływom politycznym ani komercyjnym. Naszym jedynym interesem jest dostarczenie rzetelnych danych o pracy organów państwowych.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-500">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Oparcie w Faktach</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Wszystkie publikowane dane pochodzą bezpośrednio z oficjalnego API Sejmu RP. Stosujemy rygorystyczne procedury weryfikacji, aby zapewnić najwyższą jakość prezentowanych statystyk.
            </p>
          </div>
        </div>

        {/* Process Section */}
        <div className="mb-24 bg-surface rounded-[2.5rem] p-8 md:p-12 border border-border-base">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-primary italic">Metodologia Pracy z Danymi</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="text-accent-blue font-black text-4xl opacity-20">01</div>
              <h4 className="font-bold text-primary">Agregacja</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Pobieramy kompletną historię głosowań, wypowiedzi i projektów ustaw wprost z serwerów rządowych.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-accent-blue font-black text-4xl opacity-20">02</div>
              <h4 className="font-bold text-primary">Analiza Semantyczna</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Używamy zaawansowanych modeli językowych do streszczania dokumentów i wykrywania powiązań między ustawami.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-accent-blue font-black text-4xl opacity-20">03</div>
              <h4 className="font-bold text-primary">Wizualizacja</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Przekładamy liczby na czytelne rankingi i interaktywne profile posłów, ułatwiając wyciąganie wniosków.
              </p>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-24 space-y-8">
          <h2 className="text-2xl font-bold text-primary">Plan Rozwoju Systemu</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-surface border border-border-base rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-accent-blue text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Wdrożone</div>
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-accent-blue" />
                2024-2025
              </h3>
              <ul className="space-y-3">
                {['Profil aktywności posłów i klubów', 'Analiza AI dla kluczowych projektów', 'System wyszukiwania kontekstowego'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-secondary">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 bg-surface border border-border-base rounded-2xl opacity-60">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-secondary" />
                2026+
              </h3>
              <ul className="space-y-3">
                {['Aplikacja mobilna (Native)', 'Zaawansowany komparator poglądów', 'Platforma uczestnictwa obywatelskiego'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-secondary">
                    <div className="w-4 h-4 rounded-full border border-border-base" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Legal & Open Source */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="md:col-span-2 p-8 bg-surface border border-border-base rounded-3xl space-y-4">
            <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
              <Book size={16} className="text-blue-500" />
              Podstawa Prawna i Techniczna
            </h4>
            <div className="space-y-2 text-xs text-secondary leading-relaxed">
              <p>Dane publikowane w serwisie pochodzą z Systemu Informacyjnego Sejmu i są udostępniane na zasadach ponownego wykorzystywania informacji sektora publicznego (Ustawa z dnia 11 sierpnia 2021 r.).</p>
              <p>Analizy generowane przez AI mają charakter wspomagający i nie stanowią oficjalnej wykładni prawa ani stanowiska organów państwowych.</p>
            </div>
          </div>
          <div className="p-8 bg-surface border border-border-base rounded-3xl flex flex-col justify-between">
            <div className="text-center">
              <Github size={32} className="mx-auto mb-4 text-primary opacity-20" />
              <h4 className="font-bold text-primary text-sm mb-2">Open Source</h4>
              <p className="text-[10px] text-secondary">Projekt rozwija społeczność na zasadach otwartości i współpracy.</p>
            </div>
            <a
              href="https://github.com/babar-rgb"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center py-2 bg-primary text-page rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Repozytorium GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
