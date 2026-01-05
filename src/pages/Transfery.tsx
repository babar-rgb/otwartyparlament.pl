import { useState } from 'react';
import { Users, Wallet, TrendingUp, TrendingDown, ArrowRight, BookOpen, Baby, Briefcase, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

// MOCK DATA
const PERSONAS = [
    { id: 'senior', label: 'Senior / Emeryt', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'student', label: 'Student / Uczeń', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { id: 'entrepreneur', label: 'Przedsiębiorca', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { id: 'parent', label: 'Rodzina', icon: Baby, color: 'text-pink-600', bg: 'bg-pink-500/10', border: 'border-pink-500/20' }
];

const IMPACT_VOTES = [
    {
        id: 1,
        date: '2023-12-19',
        title: 'Ustawa o zmianie ustawy o pomocy obywatelom Ukrainy',
        description: 'Przedłużenie legalnego pobytu i świadczeń socjalnych.',
        impacts: {
            senior: { score: 0, text: 'Bezpośredni wpływ neutralny.' },
            student: { score: -2, text: 'Większa konkurencja na rynku mieszkań studenckich.' },
            entrepreneur: { score: 8, text: 'Dostęp do tańszej siły roboczej, stabilność zatrudnienia.' },
            parent: { score: -5, text: 'Obciążenie systemu edukacji, trudniejszy dostęp do przedszkoli.' }
        },
        verdict: 'Uchwalono'
    },
    {
        id: 2,
        date: '2023-12-07',
        title: 'Ustawa o mrożeniu cen energii',
        description: 'Zamrożenie cen prądu na pierwszą połowę 2024 roku.',
        impacts: {
            senior: { score: 10, text: 'Ochrona przed drastycznym wzrostem rachunków.' },
            student: { score: 5, text: 'Niższe koszty utrzymania stancji/akademika.' },
            entrepreneur: { score: 7, text: 'Stabilizacja kosztów prowadzenia działalności.' },
            parent: { score: 9, text: 'Znacząca ulga dla budżetu domowego.' }
        },
        verdict: 'Uchwalono'
    },
    {
        id: 3,
        date: '2023-11-29',
        title: 'Finansowanie In Vitro',
        description: 'Przywrócenie finansowania procedury In Vitro z budżetu państwa.',
        impacts: {
            senior: { score: -1, text: 'Przesunięcie środków z innych celów zdrowotnych.' },
            student: { score: 2, text: 'Inwestycja w przyszłość demograficzną.' },
            entrepreneur: { score: 0, text: 'Neutralny wpływ biznesowy.' },
            parent: { score: 10, text: 'Kluczowe wsparcie dla par starających się o potomstwo.' }
        },
        verdict: 'Uchwalono'
    },
    {
        id: 4,
        date: '2024-01-16',
        title: 'Ustawa Budżetowa 2024',
        description: 'Plan dochodów i wydatków państwa. Rekordowy deficyt.',
        impacts: {
            senior: { score: 8, text: 'Zabezpieczenie 13. i 14. emerytury.' },
            student: { score: -4, text: 'Wzrost długu publicznego do spłaty w przyszłości.' },
            entrepreneur: { score: -6, text: 'Presja inflacyjna i ryzyko wyższych podatków.' },
            parent: { score: 7, text: 'Utrzymanie 800+ i programów socjalnych.' }
        },
        verdict: 'Uchwalono'
    }
];

const Transfery = () => {
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>('senior');
    const activePersona = PERSONAS.find(p => p.id === selectedPersonaId) || PERSONAS[0];

    const getImpactStyle = (score: number) => {
        if (score >= 7) return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: TrendingUp, label: 'Super Korzystne' };
        if (score > 0) return { color: 'text-emerald-400', bg: 'bg-emerald-500/5', icon: TrendingUp, label: 'Korzystne' };
        if (score === 0) return { color: 'text-slate-400', bg: 'bg-slate-500/10', icon: Wallet, label: 'Neutralne' };
        if (score > -7) return { color: 'text-red-400', bg: 'bg-red-500/5', icon: TrendingDown, label: 'Niekorzystne' };
        return { color: 'text-red-500', bg: 'bg-red-500/10', icon: TrendingDown, label: 'Krytyczne' };
    };

    return (
        <div className="min-h-screen bg-page pt-32 pb-16 px-4 md:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-blue/10 text-accent-blue rounded-full font-bold text-[10px] uppercase tracking-wider mb-6 border border-accent-blue/20">
                        <Wallet size={14} />
                        <span>Ekonomia Osobista</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-primary mb-6 tracking-tight leading-tight">
                        Twój Portfel a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 underline decoration-emerald-500/20 underline-offset-8">Decyzje Sejmu.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-secondary max-w-2xl leading-relaxed">
                        Zobacz, jak konkretne głosowania przekładają się na Twoją sytuację finansową.
                        Wybierz profil, aby spersonalizować analizę przepływów budżetowych.
                    </p>
                </div>

                {/* Persona Selector - Styled Like Methodology Grid */}
                <div className="mb-16 bg-surface rounded-[2.5rem] p-8 md:p-10 border border-border-base">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-primary italic">Kogo Reprezentujesz?</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {PERSONAS.map((persona) => (
                            <button
                                key={persona.id}
                                onClick={() => setSelectedPersonaId(persona.id)}
                                className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-4 group relative overflow-hidden
                                    ${selectedPersonaId === persona.id
                                        ? `${persona.border} ${persona.bg} ring-2 ring-emerald-500/20`
                                        : 'border-border-base hover:border-emerald-500/30 hover:bg-emerald-500/5'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedPersonaId === persona.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500'}`}>
                                    <persona.icon size={24} />
                                </div>
                                <span className={`font-bold text-sm ${selectedPersonaId === persona.id ? 'text-primary' : 'text-secondary'}`}>
                                    {persona.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Impact Feed */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-primary flex items-center gap-3 mb-8 px-4">
                        <Zap className="text-emerald-500" />
                        Analiza dla profilu: <span className="text-emerald-500 border-b border-emerald-500/30">{activePersona.label}</span>
                    </h2>

                    {IMPACT_VOTES.map((vote) => {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const impact = vote.impacts[selectedPersonaId];
                        const style = getImpactStyle(impact.score);
                        const Icon = style.icon;

                        return (
                            <div key={vote.id} className="group relative p-8 rounded-3xl bg-surface border border-border-base shadow-sm hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    {/* Score Card */}
                                    <div className={`flex-shrink-0 w-full md:w-32 p-4 rounded-2xl flex flex-col items-center justify-center text-center ${style.bg} border border-border-base/50`}>
                                        <Icon size={28} className={`mb-2 ${style.color}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.color}`}>
                                            {style.label}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-grow space-y-4">
                                        <div className="flex items-start justify-between">
                                            <h3 className="text-xl font-bold text-primary leading-tight group-hover:text-emerald-500 transition-colors">
                                                {vote.title}
                                            </h3>
                                            <span className="text-[10px] font-mono text-secondary uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md">
                                                {vote.date}
                                            </span>
                                        </div>

                                        <p className="text-secondary text-sm leading-relaxed">
                                            {vote.description}
                                        </p>

                                        {/* Insight Box */}
                                        <div className="pl-4 border-l-2 border-emerald-500/20 my-4">
                                            <p className="text-sm font-medium text-primary">
                                                "{impact.text}"
                                            </p>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Link to={`/glosowania/${vote.id}`} className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-2 transition-colors uppercase tracking-wider">
                                                Szczegóły <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Transfery;
