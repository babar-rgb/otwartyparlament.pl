import { Link } from 'react-router-dom';
import { Building2, Users, FileText, Vote } from 'lucide-react';

import SEO from '../components/SEO';
import TopicOfDay from '../components/TopicOfDay';
import WeeklyHighlights from '../components/WeeklyHighlights';
import TopicClusters from '../components/TopicClusters';
import PersonaSelector from '../components/PersonaSelector';
import SmartSearch from '../components/SmartSearch';

export default function Home() {
  return (
    <div className="min-h-screen bg-paper dark:bg-slate-950">
      <SEO
        title="OtwartyParlament.pl - Centrum Wiedzy o Sejmie"
        description="Twoje centrum wiedzy o Sejmie. Sprawdź głosowania, profile posłów i statystyki."
      />

      {/* Hero: Topic of Day */}
      <section className="pt-28 pb-12 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <TopicOfDay />
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-8 px-4 md:px-8 bg-slate-100 dark:bg-slate-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/glosowania" className="group">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all">
                <Vote className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-slate-900 dark:text-white">3,456</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Głosowań</div>
              </div>
            </Link>
            <Link to="/poslowie" className="group">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all">
                <Users className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-slate-900 dark:text-white">460</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Posłów</div>
              </div>
            </Link>
            <Link to="/projekty" className="group">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all">
                <FileText className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-slate-900 dark:text-white">892</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Projektów</div>
              </div>
            </Link>
            <Link to="/komisje" className="group">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all">
                <Building2 className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-2xl font-black text-slate-900 dark:text-white">39</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Komisji</div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Persona Selector - "Kompas Obywatelski" */}
      <section className="py-12 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <PersonaSelector />
        </div>
      </section>

      {/* Smart Search - "Inteligentna Wyszukiwarka" */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-amber-950">
        <div className="container mx-auto max-w-4xl">
          <SmartSearch showHero={true} />
        </div>
      </section>

      {/* Weekly Highlights */}
      <section className="py-16 px-4 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <WeeklyHighlights />
        </div>
      </section>

      {/* Topic Clusters */}
      <section className="py-16 px-4 md:px-8 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto max-w-6xl">
          <TopicClusters />
        </div>
      </section>

      {/* Komisje CTA */}
      <section className="py-16 px-4 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <Link to="/komisje" className="block group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 text-center text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-80 group-hover:opacity-100 transition" />
              <h3 className="text-3xl font-black mb-2">Komisje Sejmowe</h3>
              <p className="text-lg text-blue-100">
                Zobacz czym zajmują się posłowie za zamkniętymi drzwiami
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

