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
            <span>Nasza Misja</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-primary mb-6 tracking-tight leading-tight">
            O projekcie <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 underline decoration-blue-500/20 underline-offset-8">Otwarty Parlament.</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary max-w-2xl leading-relaxed">
            Ta strona powstała, żebyś nie musiał sam przebijać się przez tysiące dokumentów na oficjalnych stronach Sejmu. Zbieramy je w jednym miejscu i pokazujemy w czytelny sposób, bez politycznego komentarza.
          </p>
        </div>

        {/* Strategic Pillars */}
        <div className="grid md:grid-cols-2 gap-8 mb-24">
          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-accent-blue">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Informacje dla każdego</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Sejmowe dokumenty bywają trudne. My je upraszczamy – używamy technologii, by każdy mógł szybko zrozumieć, o czym jest dany projekt ustawy, bez czytania setek stron prawniczego żargonu.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Twoja prywatność</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Wierzymy, że sprawdzanie polityków nie powinno wiązać się ze śledzeniem Ciebie. Nie mamy reklam ani skryptów, które zbierają Twoje dane. To, co u nas robisz, zostaje u Ciebie.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-600 dark:text-purple-400">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Pełna niezależność</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Jako projekt społeczny, nie słuchamy żadnej partii ani korporacji. Nasz kod jest otwarty (open-source), więc każdy może sprawdzić, że nasze algorytmy nie są stronnicze.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-500">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold text-primary mb-3">Dane z samego źródła</h3>
            <p className="text-secondary leading-relaxed text-sm">
              Wszystkie nasze liczby i statystyki pochodzą prosto z serwerów Sejmu RP. Dzięki temu nie ma tu pomyłek ani fałszywych informacji – pokazujemy tylko to, co faktycznie się wydarzyło.
            </p>
          </div>
        </div>

        {/* Process Section */}
        <div className="mb-24 bg-surface rounded-[2.5rem] p-8 md:p-12 border border-border-base">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-primary italic">Jak pracujemy z danymi?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="text-accent-blue font-black text-4xl opacity-20">01</div>
              <h4 className="font-bold text-primary">Zbieramy dane</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Nasz system codziennie pobiera kompletną historię głosowań, wystąpień i projektów ustaw prosto od źródła.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-accent-blue font-black text-4xl opacity-20">02</div>
              <h4 className="font-bold text-primary">Wyciągamy wnioski</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Algorytmy streszczają setki stron dokumentów i wyłapują powiązania między ustawami, których nie widać na pierwszy rzut oka.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-accent-blue font-black text-4xl opacity-20">03</div>
              <h4 className="font-bold text-primary">Pokazujemy czytelnie</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Zamiast nudnych tabel, tworzymy rankingi i przejrzyste profile posłów, byś mógł łatwo wyrobić sobie własne zdanie.
              </p>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="mb-24 space-y-8">
          <h2 className="text-2xl font-bold text-primary">Co planujemy dalej?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-surface border border-border-base rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-accent-blue text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Gotowe</div>
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-accent-blue" />
                2024-2025
              </h3>
              <ul className="space-y-3">
                {['Profile aktywności wszystkich posłów', 'Analiza najciekawszych ustaw przez AI', 'Wyszukiwarka tematów i głosowań'].map((item, i) => (
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
                Co przed nami
              </h3>
              <ul className="space-y-3">
                {['Aplikacja na telefon', 'Lepsze porównywanie poglądów', 'Łatwiejsze kontaktowanie się z posłami'].map((item, i) => (
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
              Podstawy prawne
            </h4>
            <div className="space-y-2 text-xs text-secondary leading-relaxed">
              <p>Wszystkie dane na stronie pochodzą z oficjalnych systemów Sejmu i są publicznie dostępne dla każdego obywatela. My po prostu pomagamy w ich przeglądaniu.</p>
              <p>Analizy generowane przez AI są tylko wsparciem – nie zastępują oficjalnej wykładni prawa ani stanowisk państwowych.</p>
            </div>
          </div>
          <div className="p-8 bg-surface border border-border-base rounded-3xl flex flex-col justify-between">
            <div className="text-center">
              <Github size={32} className="mx-auto mb-4 text-primary opacity-20" />
              <h4 className="font-bold text-primary text-sm mb-2">Otwarty projekt</h4>
              <p className="text-[10px] text-secondary">Strona jest tworzona przez społeczność, dla każdego.</p>
            </div>
            <a
              href="https://github.com/babar-rgb"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center py-2 bg-primary text-page rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Nasz GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
