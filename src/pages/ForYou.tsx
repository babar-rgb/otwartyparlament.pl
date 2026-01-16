import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, GraduationCap, Tractor, User, Users, Baby, ChevronRight, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const PERSONAS = [
    { id: 'Przedsiębiorca', label: 'Przedsiębiorca', icon: Briefcase, color: 'from-blue-500 to-cyan-500', desc: 'Zmiany w podatkach, ZUS i prawie pracy.' },
    { id: 'Pracownik', label: 'Pracownik', icon: User, color: 'from-emerald-500 to-teal-500', desc: 'Płaca minimalna, urlopy, kodeks pracy.' },
    { id: 'Rolnik', label: 'Rolnik', icon: Tractor, color: 'from-yellow-500 to-orange-500', desc: 'Dopłaty, KRUS, ceny paliw i nawozów.' },
    { id: 'Emeryt', label: 'Emeryt', icon: Users, color: 'from-purple-500 to-pink-500', desc: 'Waloryzacja rent, leki, 13. i 14. emerytura.' },
    { id: 'Student', label: 'Student', icon: GraduationCap, color: 'from-indigo-500 to-violet-500', desc: 'Stypendia, akademiki, zniżki i rynek pracy.' },
    { id: 'Rodzic', label: 'Rodzic', icon: Baby, color: 'from-rose-500 to-red-500', desc: '800+, edukacja, ulgi podatkowe na dzieci.' },
];

export default function ForYou() {
    const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

    const { data: votes, isLoading } = useQuery({
        queryKey: ['for-you', selectedPersona],
        queryFn: async () => {
            if (!selectedPersona) return [];
            const res = await fetch(`http://localhost:3001/personas/feed?persona=${selectedPersona}&limit=20`);
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
        },
        enabled: !!selectedPersona
    });

    const activePersona = PERSONAS.find(p => p.id === selectedPersona);
    const ActiveIcon = activePersona?.icon || Briefcase;

    // VIEW 1: SELECTION SCREEN
    if (!selectedPersona) {
        return (
            <div className="min-h-screen bg-page text-text-primary pt-32 pb-20">
                <div className="container mx-auto px-4">

                    {/* Hero Section */}
                    <div className="max-w-3xl mx-auto text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                Sejm, który Cię rozumie.
                            </span>
                        </h1>
                        <p className="text-xl text-text-secondary leading-relaxed">
                            Nie trać czasu na czytanie tysięcy stron ustaw.
                            Nasza sztuczna inteligencja analizuje każde głosowanie i wyciąga tylko to,
                            co <span className="text-primary font-bold">realnie wpływa na Twoje życie</span>.
                        </p>
                        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-text-secondary/50">
                            Wybierz kim jesteś, aby zacząć:
                        </p>
                    </div>

                    {/* Persona Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {PERSONAS.map((persona) => {
                            const Icon = persona.icon;
                            return (
                                <motion.button
                                    key={persona.id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedPersona(persona.id)}
                                    className="group relative bg-card-bg border border-border-base hover:border-primary/50 cursor-pointer rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden"
                                >
                                    {/* Gradient Background on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${persona.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                                    <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg
                    bg-gradient-to-br ${persona.color}
                   `}>
                                        <Icon size={28} />
                                    </div>

                                    <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                                        {persona.label}
                                    </h3>
                                    <p className="text-text-secondary group-hover:text-text-primary transition-colors">
                                        {persona.desc}
                                    </p>

                                    <div className="absolute top-8 right-8 text-text-tertiary group-hover:text-primary transition-colors">
                                        <ChevronRight size={24} />
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // VIEW 2: FEED SCREEN
    return (
        <div className="min-h-screen bg-page text-text-primary pb-20 pt-24">
            {/* Mini Header & Back Button */}
            <div className="container mx-auto px-4 mb-8 flex flex-col items-start gap-4">
                <button
                    onClick={() => setSelectedPersona(null)}
                    className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Wróć do wyboru
                </button>

                <div>
                    <h2 className="text-3xl font-extrabold flex items-center gap-3">
                        Twoje Ustawy: <span className={`text-transparent bg-clip-text bg-gradient-to-r ${activePersona?.color}`}>{activePersona?.label}</span>
                    </h2>
                    <p className="text-text-secondary mt-1">
                        Oto wyfiltrowana lista decyzji Sejmu, które mają bezpośredni wpływ na Twoją grupę.
                    </p>
                </div>
            </div>

            {/* Horizontal Persona Switcher */}
            <div className="container mx-auto px-4 mb-10 overflow-x-auto no-scrollbar">
                <div className="flex gap-3 min-w-max pb-2">
                    {PERSONAS.map((persona) => {
                        const isActive = selectedPersona === persona.id;
                        const Icon = persona.icon;

                        return (
                            <button
                                key={persona.id}
                                onClick={() => setSelectedPersona(persona.id)}
                                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-bold
                  ${isActive
                                        ? `bg-gradient-to-r ${persona.color} text-white shadow-lg`
                                        : 'bg-card-bg border border-border-base hover:bg-card-hover text-text-secondary'
                                    }
                `}
                            >
                                <Icon size={16} />
                                {persona.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Feed List */}
            <div className="container mx-auto px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        // Skeletons
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 bg-card-bg/50 rounded-3xl animate-pulse" />
                        ))
                    ) : votes?.map((vote: any) => (
                        <Link key={vote.vote_id} to={`/glosowanie/${vote.vote_id}`} className="block h-full cursor-pointer group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5 }}
                                layout
                                className="relative bg-card-bg rounded-3xl p-6 border border-border-base group-hover:border-primary/30 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/5 overflow-hidden flex flex-col h-full"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${activePersona?.color} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity`} />

                                <div className="relative mb-4">
                                    <div className="flex justify-between items-start gap-4 mb-3">
                                        <span className="text-xs font-mono text-text-secondary bg-bg-secondary px-2 py-1 rounded-md">
                                            {format(new Date(vote.date), 'd MMM yyyy', { locale: pl })}
                                        </span>
                                        <div className={`
                      flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold gap-1
                      ${vote.importance >= 8 ? 'bg-red-500/20 text-red-400' : 'bg-primary/10 text-primary'}
                    `}>
                                            <span>Waga:</span>
                                            <span>{vote.importance}/10</span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-3">
                                        {vote.title}
                                    </h3>
                                </div>

                                <div className="mt-auto">
                                    <div className={`
                    relative p-4 rounded-2xl border border-white/5 bg-white/5
                    group-hover:bg-white/10 transition-colors
                  `}>
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold opacity-70">
                                            <ActiveIcon size={14} />
                                            <span className="uppercase tracking-wider">Efekt dla Ciebie</span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed text-text-primary/90">
                                            {vote.impact_text}
                                        </p>
                                    </div>
                                </div>

                                {/* Arrow indicator on hover */}
                                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <div className="bg-primary text-white p-2 rounded-full shadow-lg">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </AnimatePresence>

                {!isLoading && votes?.length === 0 && (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-20 h-20 bg-card-bg rounded-full flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                            <ActiveIcon size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">Na razie cisza...</h3>
                        <p className="text-text-secondary mt-2">
                            W ostatnich dniach Sejm nie głosował nad niczym, co miałoby szacowany wpływ na grupę: {activePersona?.label}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
