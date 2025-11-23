import { useState, useEffect } from 'react';
import { fetchMPs, fetchVotes, Vote, MP } from '../api';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, Heart, TrendingUp, Wheat, GraduationCap, Shield, Scale, Building, Zap, Cpu, Users, Globe, Palette } from 'lucide-react';
import VoteCard from '../components/VoteCard';
import MpCard from '../components/MpCard';

export default function Home() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [mps, setMps] = useState<MP[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [votesData, mpsData] = await Promise.all([fetchVotes(), fetchMPs()]);
        setVotes(votesData);
        setMps(mpsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center relative overflow-hidden">

        {/* Layer 1: The Graphic (Golden Circle) */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <svg width="650" height="650" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" className="max-w-full opacity-0 animate-fade-in">
            <rect width="100%" height="100%" fill="#D6B55E" rx="9999" />
            <g transform="translate(400, 650) scale(1, -1)" stroke="#F2F2F2" strokeWidth="2" fill="none">
              <line x1="0" y1="0" x2="350" y2="0" /> <line x1="0" y1="0" x2="338" y2="90" /> <line x1="0" y1="0" x2="303" y2="175" /> <line x1="0" y1="0" x2="247" y2="247" /> <line x1="0" y1="0" x2="175" y2="303" /> <line x1="0" y1="0" x2="90" y2="338" /> <line x1="0" y1="0" x2="0" y2="350" /> <line x1="0" y1="0" x2="-90" y2="338" /> <line x1="0" y1="0" x2="-175" y2="303" /> <line x1="0" y1="0" x2="-247" y2="247" /> <line x1="0" y1="0" x2="-303" y2="175" /> <line x1="0" y1="0" x2="-338" y2="90" /> <line x1="0" y1="0" x2="-350" y2="0" />
              <path d="M 350 0 A 350 350 0 0 1 -350 0" /> <path d="M 300 0 A 300 300 0 0 1 -300 0" /> <path d="M 250 0 A 250 250 0 0 1 -250 0" /> <path d="M 200 0 A 200 200 0 0 1 -200 0" /> <path d="M 150 0 A 150 150 0 0 1 -150 0" />
              <g fill="#F2F2F2" stroke="none">
                <circle cx="120" cy="40" r="4" /> <circle cx="140" cy="60" r="4" /> <circle cx="160" cy="80" r="4" /> <circle cx="180" cy="100" r="4" />
                <circle cx="-120" cy="40" r="4" /> <circle cx="-140" cy="60" r="4" /> <circle cx="-160" cy="80" r="4" /> <circle cx="-180" cy="100" r="4" />
              </g>
            </g>
          </svg>
        </div>

        {/* Layer 2: The Text */}
        <div className="relative z-10 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <h1 className="text-6xl md:text-8xl font-extrabold text-black leading-tight tracking-tighter mb-6">
            PROSTO<br />TRANSPARENTNIE
          </h1>
          <p className="text-2xl md:text-3xl text-slate-600 font-medium tracking-wide max-w-3xl mx-auto">
            Wszystkie głosowania z Sejmu w jednym miejscu
          </p>
        </div>

        {/* Layer 3: The Cue */}
        <div className="absolute bottom-12 animate-bounce">
          <ChevronDown size={48} className="text-black opacity-50" />
        </div>
      </section>

      {/* Top 3 Priority Votes Section */}
      <section className="bg-white py-24 px-6 relative z-20 -mt-12 rounded-t-[3rem] shadow-2xl">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-end gap-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">
              Kluczowe Decyzje
            </h2>
            <div className="h-4 w-4 bg-black rounded-full mb-2 animate-pulse"></div>
          </div>

          <div className="space-y-0">
            {/* Vote Item 1 */}
            <div className="flex flex-col md:flex-row gap-8 py-12 border-b border-slate-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl">
              <div className="flex-shrink-0 pt-1">
                <span className="text-4xl font-light text-slate-300 group-hover:text-black transition duration-300">01</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-blue-600 transition">
                  Ustawa o finansowaniu in vitro
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Temat, który zdominował nagłówki i dyskusje w mediach społecznościowych w zeszłym tygodniu. Decyzja o przywróceniu finansowania z budżetu państwa.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 flex flex-col justify-center gap-3">
                <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-center py-2 rounded-full font-bold uppercase tracking-wider text-sm">
                  PRZYJĘTO
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span>Za: 293</span>
                    <span>Przeciw: 142</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 w-[65%]"></div>
                    <div className="h-full bg-red-500 w-[35%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Item 2 */}
            <div className="flex flex-col md:flex-row gap-8 py-12 border-b border-slate-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl">
              <div className="flex-shrink-0 pt-1">
                <span className="text-4xl font-light text-slate-300 group-hover:text-black transition duration-300">02</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-blue-600 transition">
                  Wybór Marszałka Sejmu X kadencji
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Pierwsze posiedzenie Sejmu nowej kadencji i kluczowe głosowanie personalne, ustalające układ sił w prezydium.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 flex flex-col justify-center gap-3">
                <div className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-center py-2 rounded-full font-bold uppercase tracking-wider text-sm">
                  PRZYJĘTO
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span>Za: 265</span>
                    <span>Przeciw: 193</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 w-[58%]"></div>
                    <div className="h-full bg-red-500 w-[42%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vote Item 3 */}
            <div className="flex flex-col md:flex-row gap-8 py-12 border-b border-slate-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl">
              <div className="flex-shrink-0 pt-1">
                <span className="text-4xl font-light text-slate-300 group-hover:text-black transition duration-300">03</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-black mb-3 group-hover:text-blue-600 transition">
                  Odrzucenie wotum zaufania dla rządu
                </h3>
                <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
                  Historyczne głosowanie kończące misję tworzenia rządu przez dotychczasową większość. Otwarcie drogi do tzw. drugiego kroku konstytucyjnego.
                </p>
              </div>
              <div className="flex-shrink-0 w-full md:w-64 flex flex-col justify-center gap-3">
                <div className="bg-red-100 text-red-800 border border-red-200 text-center py-2 rounded-full font-bold uppercase tracking-wider text-sm">
                  ODRZUCONO
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                    <span>Za: 190</span>
                    <span>Przeciw: 266</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 w-[41%]"></div>
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
            <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4 tracking-tight">
              Obszary Tematyczne
            </h2>
            <p className="text-lg text-slate-600">
              Przeglądaj archiwum Sejmu według sektorów.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Health */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Heart className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Zdrowie</h3>
              <p className="text-sm text-slate-500">42 głosowania</p>
            </div>

            {/* Economy */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Gospodarka</h3>
              <p className="text-sm text-slate-500">68 głosowań</p>
            </div>

            {/* Agriculture */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Wheat className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Rolnictwo</h3>
              <p className="text-sm text-slate-500">23 głosowania</p>
            </div>

            {/* Education */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <GraduationCap className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Edukacja</h3>
              <p className="text-sm text-slate-500">31 głosowań</p>
            </div>

            {/* Defense */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Shield className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Obronność</h3>
              <p className="text-sm text-slate-500">19 głosowań</p>
            </div>

            {/* Justice */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Scale className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Sprawiedliwość</h3>
              <p className="text-sm text-slate-500">54 głosowania</p>
            </div>

            {/* Infrastructure */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Building className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Infrastruktura</h3>
              <p className="text-sm text-slate-500">27 głosowań</p>
            </div>

            {/* Energy */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Zap className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Energetyka</h3>
              <p className="text-sm text-slate-500">35 głosowań</p>
            </div>

            {/* Technology */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Cpu className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Technologia</h3>
              <p className="text-sm text-slate-500">16 głosowań</p>
            </div>

            {/* Social Policy */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Users className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Polityka Społeczna</h3>
              <p className="text-sm text-slate-500">49 głosowań</p>
            </div>

            {/* Foreign Affairs */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Globe className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Sprawy Zagraniczne</h3>
              <p className="text-sm text-slate-500">38 głosowań</p>
            </div>

            {/* Culture */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-black hover:scale-105 transition-all duration-300 cursor-pointer">
              <Palette className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="font-bold text-black mb-2">Kultura</h3>
              <p className="text-sm text-slate-500">14 głosowań</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
