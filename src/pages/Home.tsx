import { Link } from 'react-router-dom';
import { ChevronDown, Building2 } from 'lucide-react';

import SEO from '../components/SEO';
import UpcomingVotesWidget from '../components/UpcomingVotesWidget';
import WeeklyHighlights from '../components/WeeklyHighlights';
import TopicClusters from '../components/TopicClusters';

export default function Home() {

  return (
    <div className="min-h-screen">
      <SEO
        title="OtwartyParlament.pl"
        description="Twoje centrum wiedzy o Sejmie. Sprawdź głosowania, profile posłów i statystyki."
      />
      {/* Hero Section */}
      <section className="h-screen flex flex-col justify-center items-center relative overflow-hidden">

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
      <section className="bg-white dark:bg-paper py-24 px-6 relative z-20 -mt-12 rounded-t-[3rem] shadow-2xl">
        <div className="container mx-auto max-w-5xl">
          {/* Upcoming Votes Widget */}
          <div className="mb-12">
            <UpcomingVotesWidget />
          </div>

          <div className="flex items-end gap-4 mb-4">
            {/* Header moved to component */}
          </div>

          <div className="space-y-0">
            <WeeklyHighlights />
          </div>
        </div>
      </section>

      {/* Thematic Areas Section */}
      <section className="bg-slate-50 dark:bg-transparent py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <TopicClusters />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-12">
            {/* Komisje - Keep as static link */}
            <Link to="/komisje" className="col-span-2 md:col-start-2 lg:col-start-auto">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 flex flex-col items-center text-center hover:border-blue-400 hover:scale-105 transition-all duration-300 cursor-pointer h-full">
                <Building2 className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="font-bold text-blue-900 mb-2">Komisje Sejmowe</h3>
                <p className="text-sm text-blue-600">Zobacz czym zajmują się posłowie</p>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
