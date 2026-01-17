import { Heart, Github, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface text-primary mt-16 border-t border-border-base">
      <div className="container mx-auto max-w-screen-2xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Otwarty Parlament</h3>
            <p className="text-sm text-secondary leading-relaxed">
              Transparentna, niekomercyjna platforma stworzona dla demokracji.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Nawigacja</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="text-slate-400 hover:text-white transition">Strona główna</a></li>
              <li><a href="/poslowie" className="text-slate-400 hover:text-white transition">Posłowie</a></li>
              <li><a href="/glosowania" className="text-slate-400 hover:text-white transition">Głosowania</a></li>
              <li><a href="/partie" className="text-slate-400 hover:text-white transition">Partie</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Zasoby</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/rankingi" className="text-slate-400 hover:text-white transition">Rankingi</a></li>
              <li><a href="/test" className="text-slate-400 hover:text-white transition">Test wyborczy</a></li>
              <li><a href="/o-projekcie" className="text-slate-400 hover:text-white transition">O projekcie</a></li>
              <li><a href="/metodologia" className="text-slate-400 hover:text-white transition">Metodologia i Weryfikacja</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Kontakt</h4>
            <div className="space-y-3">
              <a href="/kontakt" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                <Mail size={16} />
                Formularz kontaktowy
              </a>
              <a href="https://github.com/babar-rgb" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                <Github size={16} />
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-4">
            <Heart size={16} className="text-red-500" />
            <span>Platforma ułatwiająca dostęp do danych publicznych</span>
          </div>
          <div className="text-center text-xs text-slate-500">
            © 2025 Otwarty Parlament. Wszystkie dane są publiczne i otwarte.
          </div>
        </div>
      </div>
    </footer>
  );
}
