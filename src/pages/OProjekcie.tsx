import { Heart, Github, Book, Lock, Zap, Users } from 'lucide-react';

export default function OProjekcie() {
  return (
    <div className="space-y-12">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 md:p-12">
        <Heart className="w-12 h-12 mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">O Projekcie</h1>
        <p className="text-lg md:text-xl text-blue-100">
          Otwarty Parlament to inicjatywa dedykowana przejrzystości i odpowiedzialności w polskim systemie parlamentarnym.
        </p>
      </div>

      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Misja</h2>
        <div className="prose prose-slate max-w-none">
          <p className="text-lg text-slate-700 mb-6">
            Wierzymy, że <strong>przejrzystość jest fundamentem demokracji</strong>. Każdy obywatel ma prawo wiedzieć, jak głosują ich reprezentanci,
            jakie projekty wspierają i ile czasu poświęcają pracy w Sejmie.
          </p>
          <p className="text-lg text-slate-700 mb-6">
            Otwarty Parlament to narzędzie, które czyni te informacje łatwo dostępnymi, przeszukiwalnymi i zrozumiałymi dla każdego. Bez względu
            na znajomość polityki, każdy powinien móc sprawdzić, jak zagłosował jego poseł.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Zakładka-idea: Transparentność dla wszystkich</h2>
        <div className="bg-gradient-to-br from-slate-100 to-slate-50 rounded-lg border border-slate-200 p-8">
          <p className="text-slate-700 mb-4">
            Od początku istnienia pomysłu na tę stronę przyświecała nam <strong>jedna idea: transparentność</strong>.
          </p>
          <p className="text-slate-700 mb-4">
            Dlatego:
          </p>
          <ul className="space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold flex-shrink-0">✓</span>
              <span><strong>Nie zarabiamy na niej</strong> - Otwarty Parlament jest non-profit i zawsze będzie bezpłatny</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold flex-shrink-0">✓</span>
              <span><strong>Udostępniamy kod</strong> - Projekt jest open source, każdy może go sprawdzić, audytować i wspierać</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 font-bold flex-shrink-0">✓</span>
              <span><strong>Pokazujemy źródła</strong> - Każda dana pochodzi z publicznych źródeł i jest jasno oznaczona</span>
            </li>
          </ul>
          <p className="text-slate-700 mt-6 italic">
            Wierzymy, że jeśli będziemy budować nasz wspólny świat na bazie transparentności, stanie się on lepszym miejscem.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Jak to działa?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <Zap className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Automatyczne zbieranie danych</h3>
            <p className="text-slate-700 text-sm">
              Codziennie pobieramy dane z oficjalnych źródeł Sejmu i mediów, aby mieć zawsze aktualne informacje o głosowaniach.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Inteligentna klasyfikacja</h3>
            <p className="text-slate-700 text-sm">
              Używamy sztucznej inteligencji do automatycznego przypisywania głosowań do kategorii i oceny ich ważności dla społeczeństwa.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <Lock className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Bezpieczeństwo danych</h3>
            <p className="text-slate-700 text-sm">
              Wszystkie dane są publiczne i otwarte. Szanujemy prywatność i bezpieczeństwo użytkowników.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Technologia</h2>
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <p className="text-slate-700 mb-4">
            Otwarty Parlament zbudowany jest na nowoczesnych, open-source technologiach:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Frontend</p>
              <p>React + TypeScript + TailwindCSS</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Backend</p>
              <p>Supabase + Edge Functions</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">AI/ML</p>
              <p>Automatyczna klasyfikacja tematyki i ważności</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Hosting</p>
              <p>Supabase + Vercel/Similar</p>
            </div>
          </div>
          <a href="#" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold mt-6">
            <Github size={18} />
            Przejrzyj kod na GitHub
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Źródła danych</h2>
        <div className="bg-white rounded-lg border border-slate-200 p-8">
          <p className="text-slate-700 mb-6">
            Wszystkie dane pochodzą z publicznych, oficjalnych źródeł:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Book size={20} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900">Sejm RP</p>
                <p className="text-sm text-slate-600">api.sejm.gov.pl - oficjalne API Sejmu</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Book size={20} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900">Dane rządowe</p>
                <p className="text-sm text-slate-600">dane.gov.pl - otwarte dane publiczne</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Book size={20} className="text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900">Media i prasa</p>
                <p className="text-sm text-slate-600">Zbiór RSS i API mediów informacyjnych</p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Plan na przyszłość</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-900 mb-3">Krótkoterminowo (Q4 2024)</h3>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>✓ Rozszerzone analizy i wykresy</li>
              <li>✓ Newsletter tygodniowy</li>
              <li>✓ Rankingi posłów</li>
              <li>✓ Pełna historia głosowań</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-900 mb-3">Długoterminowo (2025+)</h3>
            <ul className="text-sm text-slate-700 space-y-2">
              <li>• Porównanie głosów posłów</li>
              <li>• API dla programistów</li>
              <li>• Mobilna aplikacja</li>
              <li>• Integracja z sieciami społecznościowymi</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Chcesz wesprzeć projekt?</h2>
        <p className="text-slate-700 mb-6">
          Otwarty Parlament to inicjatywa społeczna. Możesz nam pomóc na wiele sposobów:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="#" className="bg-white border border-slate-200 rounded-lg p-4 hover: transition text-center">
            <Github className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-900 mb-1">Kod</p>
            <p className="text-sm text-slate-600">Wpisz się w kod na GitHub</p>
          </a>

          <a href="mailto:info@otwartyparlament.pl" className="bg-white border border-slate-200 rounded-lg p-4 hover: transition text-center">
            <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-900 mb-1">Feedback</p>
            <p className="text-sm text-slate-600">Podziel się opinią</p>
          </a>

          <a href="#" className="bg-white border border-slate-200 rounded-lg p-4 hover: transition text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-900 mb-1">Udostępnij</p>
            <p className="text-sm text-slate-600">Rozpowszechnij ideę</p>
          </a>
        </div>
      </section>

      <section className="text-center py-8">
        <p className="text-slate-600 mb-2">
          Zbudowane z pasją dla demokracji
        </p>
        <p className="text-xs text-slate-500">
          © 2024 Otwarty Parlament • Wszystkie dane są publiczne i otwarte
        </p>
      </section>
    </div>
  );
}
