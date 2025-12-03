import { Link } from 'react-router-dom';
import { ChevronDown, Heart, TrendingUp, Wheat, GraduationCap, Shield, Scale, Building, Zap, Cpu, Users, Globe, Palette } from 'lucide-react';

export default function Home() {

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center relative overflow-hidden bg-paper">

        {/* Layer 1: The Graphic (Golden Circle) */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <svg width="650" height="650" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" className="max-w-full opacity-100 animate-[fadeIn_1.5s_ease-out]">
            <rect width="100%" height="100%" fill="#D6B55E" rx="9999" />
            <g transform="translate(400, 650) scale(1, -1)" stroke="#F9F9F7" strokeWidth="2" fill="none">
              <line x1="0" y1="0" x2="350" y2="0" /> <line x1="0" y1="0" x2="338" y2="90" /> <line x1="0" y1="0" x2="303" y2="175" /> <line x1="0" y1="0" x2="247" y2="247" /> <line x1="0" y1="0" x2="175" y2="303" /> <line x1="0" y1="0" x2="90" y2="338" /> <line x1="0" y1="0" x2="0" y2="350" /> <line x1="0" y1="0" x2="-90" y2="338" /> <line x1="0" y1="0" x2="-175" y2="303" /> <line x1="0" y1="0" x2="-247" y2="247" /> <line x1="0" y1="0" x2="-303" y2="175" /> <line x1="0" y1="0" x2="-338" y2="90" /> <line x1="0" y1="0" x2="-350" y2="0" />
              <path d="M 350 0 A 350 350 0 0 1 -350 0" /> <path d="M 300 0 A 300 300 0 0 1 -300 0" /> <path d="M 250 0 A 250 250 0 0 1 -250 0" /> <path d="M 200 0 A 200 200 0 0 1 -200 0" /> <path d="M 150 0 A 150 150 0 0 1 -150 0" />
              <g fill="#F9F9F7" stroke="none">
                <circle cx="120" cy="40" r="4" /> <circle cx="140" cy="60" r="4" /> <circle cx="160" cy="80" r="4" /> <circle cx="180" cy="100" r="4" />
                <circle cx="-120" cy="40" r="4" /> <circle cx="-140" cy="60" r="4" /> <circle cx="-160" cy="80" r="4" /> <circle cx="-180" cy="100" r="4" />
              </g>
            </g>
          </svg>
        </div>

        {/* Layer 2: The Text */}
        <div className="relative z-10 text-center opacity-100 animate-[slideUp_1s_ease-out_0.5s_both]">
          <h1 className="text-6xl md:text-8xl font-extrabold text-ink leading-tight tracking-tighter mb-6">
            PROSTO<br />TRANSPARENTNIE
          </h1>
          <p className="text-2xl md:text-3xl text-ink-light font-medium tracking-wide max-w-3xl mx-auto">
            Wszystkie głosowania z Sejmu w jednym miejscu
          </p>
        </div>

        {/* Layer 3: The Cue */}
        <div className="absolute bottom-12 animate-bounce">
          <ChevronDown size={48} className="text-ink opacity-50" />
        </div>
      </section>

      {/* Top 3 Priority Votes Section */}
      <section className="bg-white py-24 px-6 relative z-20 -mt-12 rounded-t-[3rem] shadow-2xl">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-end gap-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-ink tracking-tight">
              Kluczowe Decyzje
            </h2>
            <div className="h-4 w-4 bg-black rounded-full mb-2 animate-pulse"></div>
          </div>

          <div className="space-y-0">
            {/* Vote Item 1 */}
            <div className="flex flex-col md:flex-row gap-8 py-12 border-b border-slate-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl">
              <div className="flex-shrink-0 pt-1">
                <span className="text-4xl font-light text-slate-300 group-hover:text-ink transition duration-300">01</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-ink mb-3 group-hover:text-blue-600 transition">
                  Ustawa o finansowaniu in vitro
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Temat, który zdominował nagłówki i dyskusje w mediach społecznościowych w zeszłym tygodniu. Decyzja o przywróceniu finansowania z budżetu państwa.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 flex flex-col justify-center gap-3">
                <div className="bg-vote-yesBg text-vote-yes border border-vote-yes/20 text-center py-2 rounded-full font-bold uppercase tracking-wider text-sm">
                  PRZYJĘTO
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span>Za: 293</span>
                    <span>Przeciw: 142</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-vote-yes w-[65%]"></div>
                    <div className="h-full bg-red-500 w-[35%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Item 2 */}
            <div className="flex flex-col md:flex-row gap-8 py-12 border-b border-slate-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl">
              <div className="flex-shrink-0 pt-1">
                <span className="text-4xl font-light text-slate-300 group-hover:text-ink transition duration-300">02</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-ink mb-3 group-hover:text-blue-600 transition">
                  Wybór Marszałka Sejmu X kadencji
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Pierwsze posiedzenie Sejmu nowej kadencji i kluczowe głosowanie personalne, ustalające układ sił w prezydium.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 flex flex-col justify-center gap-3">
                <div className="bg-vote-yesBg text-vote-yes border border-vote-yes/20 text-center py-2 rounded-full font-bold uppercase tracking-wider text-sm">
                  PRZYJĘTO
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span>Za: 265</span>
                    <span>Przeciw: 193</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-vote-yes w-[58%]"></div>
                    <div className="h-full bg-red-500 w-[42%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Item 3 */}
            <div className="flex flex-col md:flex-row gap-8 py-12 border-b border-slate-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl">
              <div className="flex-shrink-0 pt-1">
                <span className="text-4xl font-light text-slate-300 group-hover:text-ink transition duration-300">03</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-ink mb-3 group-hover:text-blue-600 transition">
                  Odrzucenie wotum zaufania dla rządu
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Historyczne głosowanie kończące misję tworzenia rządu przez dotychczasową większość. Otwarcie drogi do tzw. drugiego kroku konstytucyjnego.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 flex flex-col justify-center gap-3">
                <div className="bg-vote-noBg text-vote-no border border-vote-no/20 text-center py-2 rounded-full font-bold uppercase tracking-wider text-sm">
                  ODRZUCONO
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span>Za: 190</span>
                    <span>Przeciw: 266</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-vote-yes w-[41%]"></div>
                    <div className="h-full bg-red-500 w-[59%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Thematic Areas Section */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-ink mb-4 tracking-tight">
              Obszary Tematyczne
            </h2>
            <p className="text-lg text-slate-600">
              Przeglądaj archiwum Sejmu według sektorów.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Health */}
            <Link to="/tematy/zdrowie">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Heart className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Zdrowie</h3>
                <p className="text-sm text-slate-500">42 głosowania</p>
              </div>
            </Link>

            {/* Economy */}
            <Link to="/tematy/gospodarka">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Gospodarka</h3>
                <p className="text-sm text-slate-500">68 głosowań</p>
              </div>
            </Link>

            {/* Agriculture */}
            <Link to="/tematy/rolnictwo">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Wheat className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Rolnictwo</h3>
                <p className="text-sm text-slate-500">23 głosowania</p>
              </div>
            </Link>

            {/* Education */}
            <Link to="/tematy/edukacja">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <GraduationCap className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Edukacja</h3>
                <p className="text-sm text-slate-500">31 głosowań</p>
              </div>
            </Link>

            {/* Defense */}
            <Link to="/tematy/obronnosc">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Shield className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Obronność</h3>
                <p className="text-sm text-slate-500">19 głosowań</p>
              </div>
            </Link>

            {/* Justice */}
            <Link to="/tematy/sprawiedliwosc">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Scale className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Sprawiedliwość</h3>
                <p className="text-sm text-slate-500">54 głosowania</p>
              </div>
            </Link>

            {/* Infrastructure */}
            <Link to="/tematy/infrastruktura">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Building className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Infrastruktura</h3>
                <p className="text-sm text-slate-500">27 głosowań</p>
              </div>
            </Link>

            {/* Energy */}
            <Link to="/tematy/energetyka">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Zap className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Energetyka</h3>
                <p className="text-sm text-slate-500">35 głosowań</p>
              </div>
            </Link>

            {/* Technology */}
            <Link to="/tematy/technologia">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Cpu className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Technologia</h3>
                <p className="text-sm text-slate-500">16 głosowań</p>
              </div>
            </Link>

            {/* Social Policy */}
            <Link to="/tematy/polityka-spoleczna">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Users className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Polityka Społeczna</h3>
                <p className="text-sm text-slate-500">49 głosowań</p>
              </div>
            </Link>

            {/* Foreign Affairs */}
            <Link to="/tematy/sprawy-zagraniczne">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Globe className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Sprawy Zagraniczne</h3>
                <p className="text-sm text-slate-500">38 głosowań</p>
              </div>
            </Link>

            {/* Culture */}
            <Link to="/tematy/kultura">
              <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Palette className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="font-bold text-ink mb-2">Kultura</h3>
                <p className="text-sm text-slate-500">14 głosowań</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
