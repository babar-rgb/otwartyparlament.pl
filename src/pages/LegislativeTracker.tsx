import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useLegislativeProcesses } from '../hooks/useLegislativeProcesses';

const LegislativeTracker: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const { data, isLoading: loading } = useLegislativeProcesses({ q: searchTerm });

    const processes = data?.items || [];

    return (
        <div className="min-h-screen bg-background font-sans text-primary pb-20">
            {/* Hero Section */}
            <div className="relative pt-32 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-background to-background pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-500/20">
                            <Activity size={12} />
                            Legislative Tracker v1.0
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                            Śledź <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Procesy Legislacyjne</span>
                        </h1>
                        <p className="text-xl text-secondary max-w-2xl leading-relaxed">
                            Zobacz systemowy podgląd prac Sejmu. Wszystkie ustawy, poprawki i weta w jednym miejscu.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Controls */}
            <div className="max-w-7xl mx-auto px-6 mb-12">
                <div className="bg-surface border border-border-base rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Szukaj ustawy (np. 'Budżetowa')..."
                            className="w-full pl-12 pr-4 py-3 bg-background border border-border-base rounded-xl focus:outline-none focus:border-indigo-500 transition-colors text-primary placeholder-secondary/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-7xl mx-auto px-6">
                {loading ? (
                    <div className="text-center py-20 text-secondary animate-pulse">Ładowanie procesów...</div>
                ) : processes.length === 0 ? (
                    <div className="text-center py-20 text-secondary">
                        <p className="text-xl font-bold mb-2">Brak wyników</p>
                        <p className="text-sm">Nasze crawlery wciąż pracują nad indeksowaniem starszych ustaw.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {processes.map((process: any, idx: number) => (
                            <motion.div
                                key={process.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Link
                                    to={`/procesy/${process.id}`}
                                    className="block bg-surface border border-border-base rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group h-full flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-secondary">
                                            {(() => {
                                                try {
                                                    return process.start_date ? format(new Date(process.start_date), 'dd.MM.yyyy', { locale: pl }) : 'Brak daty';
                                                } catch (e) {
                                                    return 'Brak daty';
                                                }
                                            })()}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${process.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                            process.status === 'SIGNED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {process.status || 'W TOKU'}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-primary mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {process.title}
                                    </h3>

                                    <div className="mt-auto pt-6 border-t border-border-base/50">
                                        <div className="flex items-center justify-between text-xs text-secondary mb-2">
                                            <span>Postęp prac</span>
                                            <span className="font-mono">{process.stage_count || 0} etapów</span>
                                        </div>
                                        {/* Progress Bar Visual */}
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
                                                style={{ width: `${Math.min(((process.stage_count || 0) / 10) * 100, 100)}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <Clock size={12} />
                                            <span>Ostatnia zmiana: {process.last_stage_title || 'Brak danych'}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default LegislativeTracker;
