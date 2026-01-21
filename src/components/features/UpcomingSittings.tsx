import React, { useEffect, useState } from 'react';
import { Calendar, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { fetchUpcomingSittings } from '../../api';

interface Sitting {
    number: number;
    title: string;
    dates: string[];
    is_current: boolean;
}

export const UpcomingSittings: React.FC = () => {
    const [sittings, setSittings] = useState<Sitting[]>([]);
    const [isOpen, setIsOpen] = useState(false);
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
        <div className="mb-8 border border-white/10 rounded-lg bg-black/40 backdrop-blur-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-white">Terminarz Parlamentarny</h3>
                        <p className="text-xs text-white/50">
                            {loading ? "Pobieranie danych..." : `Nadchodzące posiedzenia: ${sittings.length}`}
                        </p>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
            </button>

            {isOpen && (
                <div className="p-4 space-y-3">
                    {sittings.map((sitting) => (
                        <div key={sitting.number} className="flex gap-4 p-3 rounded bg-white/5 border border-white/10">
                            <div className="flex flex-col items-center justify-center min-w-[60px] p-2 bg-white/5 rounded border border-white/10">
                                <span className="text-xs text-blue-400 font-mono">NR</span>
                                <span className="text-xl font-bold text-white">{sitting.number}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-1.5 py-0.5 text-[10px] rounded border ${sitting.is_current ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400'}`}>
                                        {sitting.is_current ? 'TRWA TERAZ' : 'PLANOWANE'}
                                    </span>
                                    <span className="text-xs text-white/50 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Warszawa, Sejm RP
                                    </span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-200 mb-1 leading-snug">{sitting.title}</h4>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {sitting.dates.map(date => (
                                        <span key={date} className="px-2 py-0.5 text-xs bg-black/40 text-gray-400 rounded border border-white/5">
                                            {date}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
