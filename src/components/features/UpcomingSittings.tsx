import React, { useEffect, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { fetchUpcomingSittings } from '../../api';

interface Sitting {
    number: number;
    title: string;
    dates: string[];
    is_current: boolean;
}

interface UpcomingSittingsProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const UpcomingSittings: React.FC<UpcomingSittingsProps> = ({ isOpen, onToggle }) => {
    const [sittings, setSittings] = useState<Sitting[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSittings = async () => {
            try {
                const data = await fetchUpcomingSittings();
                setSittings(data);
            } catch (e) {
                console.error("Failed to load upcoming sittings", e);
            } finally {
                setLoading(false);
            }
        };
        loadSittings();
    }, []);

    if (!loading && sittings.length === 0) return null;

    return (
        <div className="rounded-xl overflow-hidden transition-all duration-300
            bg-white border border-slate-200 shadow-sm
            dark:bg-gradient-to-r dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-500/20 dark:shadow-blue-900/10 dark:backdrop-blur-md">

            <button
                onClick={onToggle}
                className={`w-full flex items-center ${isOpen ? 'justify-between px-4 py-4' : 'justify-center py-4'} transition-all group hover:bg-slate-50 dark:hover:bg-white/5`}
            >
                <div className={`flex items-center ${isOpen ? 'gap-4' : 'gap-0'}`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110
                        bg-blue-100/50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Calendar size={20} strokeWidth={2.5} />
                    </div>

                    {/* HIDE TEXT IF CLOSED */}
                    <div className={`text-left transition-all duration-300 overflow-hidden ${isOpen ? 'opacity-100 max-w-[200px] ml-4' : 'opacity-0 max-w-0 ml-0'}`}>
                        <h3 className="font-black text-primary text-sm leading-tight">Terminarz Parlamentarny</h3>
                        <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mt-0.5">
                            Nadchodzące posiedzenia: {sittings.length}
                        </p>
                    </div>
                </div>

                {/* HIDE CHEVRON IF CLOSED (Or maybe keep it small? Better hide to save space) */}
                {isOpen && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 bg-surface border border-border-base group-hover:bg-white dark:group-hover:bg-slate-800 shadow-sm`}>
                        <ChevronUp size={16} className={`text-secondary transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-180'}`} />
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="p-4 space-y-3 
                    border-t border-slate-100 bg-slate-50/50
                    dark:border-white/5 dark:bg-black/20">

                    {sittings.map((sitting) => (
                        <div key={sitting.number} className="group flex flex-col md:flex-row gap-4 p-4 rounded-lg transition-all
                            bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md
                            dark:bg-black/20 dark:border-white/5 dark:hover:bg-blue-900/10 dark:hover:border-blue-500/30">

                            <div className="flex flex-row md:flex-col items-center justify-between md:justify-center min-w-[70px] p-2 rounded-lg
                                bg-slate-50 border border-slate-100 group-hover:border-blue-200
                                dark:bg-white/5 dark:border-white/10 dark:group-hover:border-blue-500/20">
                                <span className="text-[10px] font-black tracking-widest uppercase
                                    text-slate-400
                                    dark:text-blue-400">NR</span>
                                <span className="text-2xl font-black
                                    text-slate-700
                                    dark:text-white">{sitting.number}</span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded border ${sitting.is_current
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                                        : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'}`}>
                                        {sitting.is_current ? 'TRWA TERAZ' : 'PLANOWANE'}
                                    </span>
                                    <span className="text-xs flex items-center gap-1 font-medium
                                        text-slate-500
                                        dark:text-white/50">
                                        <MapPin className="w-3 h-3" /> Warszawa, Sejm RP
                                    </span>
                                </div>
                                <h4 className="text-base font-bold mb-2 leading-snug transition-colors
                                    text-slate-800 group-hover:text-blue-600
                                    dark:text-white dark:group-hover:text-blue-200">
                                    {sitting.title}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {sitting.dates.map(date => (
                                        <span key={date} className="px-2.5 py-1 text-xs font-semibold rounded border flex items-center gap-1.5
                                            bg-slate-50 text-slate-600 border-slate-200
                                            dark:bg-black/40 dark:text-blue-100/80 dark:border-white/10">
                                            <div className="w-1.5 h-1.5 rounded-full
                                                bg-slate-300
                                                dark:bg-blue-500/50"></div>
                                            {date}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {sittings.length === 0 && (
                        <div className="text-center py-6 text-sm
                            text-slate-500
                            dark:text-white/40">
                            Brak zaplanowanych posiedzeń w najbliższym czasie.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
