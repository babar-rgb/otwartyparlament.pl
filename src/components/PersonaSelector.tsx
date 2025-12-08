import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Tractor, Stethoscope, Briefcase, GraduationCap, Baby, Shield } from 'lucide-react';

interface Persona {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    description: string;
}

const PERSONAS: Persona[] = [
    {
        id: 'Rolnik',
        name: 'Rolnik',
        icon: <Tractor size={24} />,
        color: 'text-green-700',
        bgColor: 'bg-green-100 hover:bg-green-200',
        description: 'Głosowania dotyczące rolnictwa i wsi'
    },
    {
        id: 'Pacjent',
        name: 'Pacjent',
        icon: <Stethoscope size={24} />,
        color: 'text-red-700',
        bgColor: 'bg-red-100 hover:bg-red-200',
        description: 'Głosowania dotyczące zdrowia'
    },
    {
        id: 'Przedsiębiorca',
        name: 'Przedsiębiorca',
        icon: <Briefcase size={24} />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 hover:bg-blue-200',
        description: 'Głosowania dotyczące gospodarki i biznesu'
    },
    {
        id: 'Student',
        name: 'Student',
        icon: <GraduationCap size={24} />,
        color: 'text-purple-700',
        bgColor: 'bg-purple-100 hover:bg-purple-200',
        description: 'Głosowania dotyczące edukacji'
    },
    {
        id: 'Rodzic',
        name: 'Rodzic',
        icon: <Baby size={24} />,
        color: 'text-pink-700',
        bgColor: 'bg-pink-100 hover:bg-pink-200',
        description: 'Głosowania dotyczące rodziny i dzieci'
    },
    {
        id: 'Senior',
        name: 'Senior',
        icon: <User size={24} />,
        color: 'text-amber-700',
        bgColor: 'bg-amber-100 hover:bg-amber-200',
        description: 'Głosowania dotyczące emerytów'
    },
    {
        id: 'Pracownik',
        name: 'Pracownik',
        icon: <User size={24} />,
        color: 'text-slate-700',
        bgColor: 'bg-slate-100 hover:bg-slate-200',
        description: 'Głosowania dotyczące pracy i zatrudnienia'
    },
    {
        id: 'Żołnierz',
        name: 'Żołnierz',
        icon: <Shield size={24} />,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100 hover:bg-emerald-200',
        description: 'Głosowania dotyczące obronności'
    }
];

export default function PersonaSelector() {
    const [hoveredPersona, setHoveredPersona] = useState<string | null>(null);

    return (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 rounded-3xl p-8 md:p-12 border border-indigo-100 dark:border-slate-700 shadow-xl">
            {/* Header with persona icon */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 shadow-lg">
                    <User size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">
                    Twoje sprawy na pierwszym miejscu
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Jesteś rolnikiem? Chorujesz? Wybierz swój profil, a my pokażemy Ci tylko te ustawy, które zmieniają Twoje życie.
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {PERSONAS.map((persona) => (
                    <Link
                        key={persona.id}
                        to={`/glosowania?persona=${encodeURIComponent(persona.id)}`}
                        className={`
              flex flex-col items-center justify-center p-6 rounded-xl
              ${persona.bgColor} ${persona.color}
              transition-all duration-200 transform hover:scale-105 hover:shadow-lg
              border-2 border-transparent hover:border-current
            `}
                        onMouseEnter={() => setHoveredPersona(persona.id)}
                        onMouseLeave={() => setHoveredPersona(null)}
                    >
                        <div className="mb-3">
                            {persona.icon}
                        </div>
                        <span className="font-bold text-lg">{persona.name}</span>
                        {hoveredPersona === persona.id && (
                            <span className="text-xs mt-2 text-center opacity-80">
                                {persona.description}
                            </span>
                        )}
                    </Link>
                ))}
            </div>

            <div className="mt-6 text-center">
                <Link
                    to="/glosowania"
                    className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                >
                    Zobacz wszystkie głosowania →
                </Link>
            </div>
        </div>
    );
}
