import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    FileText,
    CircuitBoard,
    Network,
    Layers,
    Sparkles
} from 'lucide-react';
import LegislativeProcessTimeline from '../components/features/analysis/LegislativeProcessTimeline';
import LegislativeNetwork from '../components/features/analysis/LegislativeNetwork';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useLegislativeProcessDetails } from '../hooks/useLegislativeProcessDetails';
import SEO from '../components/SEO';

const LegislativeProcessDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: process, isLoading: loading } = useLegislativeProcessDetails(id);

    if (loading) return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <div className="text-secondary font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Data Stream...</div>
            </div>
        </div>
    );

    if (!process) return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-2xl font-bold text-primary mb-4">Nie znaleziono procesu</h1>
            <Link to="/procesy" className="px-6 py-3 bg-white/5 rounded-xl text-indigo-400 hover:bg-white/10 transition-all border border-white/10 font-bold">
                Wróć do bazy procesów
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0A0A] font-sans text-primary pb-24 pt-24 px-6 overflow-x-hidden">
            <SEO
                title={`${process.title}`}
                description={process.description || `Szczegóły procesu legislacyjnego: ${process.title}. Sprawdź etapy, druki i powiązania.`}
                url={`/procesy/${id}`}
            />
            {/* Background Ambient Orbs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto">
                {/* Navigation */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-12 flex items-center justify-between"
                >
                    <Link to="/procesy" className="group flex items-center gap-3 text-secondary hover:text-primary transition-all">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all">
                            <ArrowLeft size={16} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Dashboard Procesów</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-secondary tracking-[0.3em] uppercase opacity-40">
                        Legislative Intelligence System v2.0
                    </div>
                </motion.div>

                {/* Hero Section - Situation Room Style */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-gradient-to-br from-[#121212] to-[#0D0D0D] border border-white/10 rounded-[2.5rem] p-10 md:p-16 mb-16 shadow-2xl overflow-hidden group"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                        <CircuitBoard size={240} strokeWidth={0.5} />
                    </div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-8">
                            <div className="flex flex-wrap items-center gap-4 mb-8">
                                <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                    Proces Aktywny
                                </div>
                                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-mono text-secondary flex items-center gap-2">
                                    <Calendar size={12} className="opacity-50" />
                                    Data wszczęcia: {(() => {
                                        try {
                                            return process.start_date ? format(new Date(process.start_date), 'dd MMM yyyy', { locale: pl }) : 'Brak daty';
                                        } catch (e) {
                                            return 'Brak daty';
                                        }
                                    })()}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${process.status === 'IN_PROGRESS' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                    process.status === 'SIGNED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                        'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}>
                                    {process.status === 'IN_PROGRESS' ? 'W TOKU' : process.status === 'SIGNED' ? 'PODPISANA' : process.status === 'REJECTED' ? 'ODRZUCONA' : process.status}
                                </div>
                            </div>

                            <h1 className="text-4xl md:text-6xl font-black mb-8 leading-[1.1] tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 transition-all duration-700">
                                {process.title}
                            </h1>

                            <div className="flex flex-wrap gap-4">
                                <button className="px-8 py-4 rounded-2xl bg-indigo-500 text-white font-black text-sm hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-3">
                                    <FileText size={18} />
                                    Dokumenty Źródłowe
                                </button>
                                <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-primary font-black text-sm hover:bg-white/10 transition-all flex items-center gap-3">
                                    <Sparkles size={18} className="text-indigo-400" />
                                    Analiza AI
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 hidden lg:block">
                            <div className="p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                                <div className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-6 block">Kluczowe Wskaźniki</div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-secondary/60">Liczba Etapów</span>
                                        <span className="text-sm font-bold font-mono">{(process.stages || []).length}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (process.stages || []).length * 10)}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-secondary/60">Powiązane Podmioty</span>
                                        <span className="text-sm font-bold font-mono">{process.graph?.nodes?.length || 0}</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (process.graph?.nodes?.length || 0) * 15)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">

                    {/* Left Column: Metro Timeline (The Main Flow) */}
                    <div className="xl:col-span-7">
                        <section className="relative">
                            <div className="flex items-center gap-4 mb-10 px-4">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <Layers size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-none mb-2">Oś Czasu Procesu</h2>
                                    <p className="text-xs text-secondary/60 font-mono tracking-wider uppercase">Linear Legislative Progression</p>
                                </div>
                            </div>

                            <div className="bg-[#0F0F0F] rounded-[3rem] border border-white/5 p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-20 -mt-20" />
                                <LegislativeProcessTimeline stages={process.stages || []} variant="full" />
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Interaction Graph & Meta */}
                    <div className="xl:col-span-5 space-y-12">

                        {/* Summary / AI Narrative (Placeholder till real data is backfilled) */}
                        <motion.section
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] p-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                <Sparkles size={24} className="text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                Analiza Proceduralna AI
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">BETA</span>
                            </h3>
                            <p className="text-sm leading-relaxed text-secondary/80 italic">
                                "{process.description || 'System Gemini obecnie analizuje wzajemne powiązania między drukami oraz skutki prawne tego etapu. Pełny raport narracyjny pojawi się wkrótce (trwa backfill danych historycznych).'}"
                            </p>
                            <div className="mt-6 pt-6 border-t border-indigo-500/10 flex items-center gap-2 text-[10px] font-bold text-secondary uppercase tracking-widest">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                Weryfikacja treści: Gemini 2.0 (Preview)
                            </div>
                        </motion.section>

                        {/* Network Graph */}
                        {process.graph && process.graph.nodes.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                        <Network size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-white leading-none mb-1">Graf Powiązań</h2>
                                        <p className="text-[10px] text-secondary/60 font-mono tracking-wider uppercase">Relational Document Mapping</p>
                                    </div>
                                </div>

                                <div className="bg-[#0F0F0F] rounded-[2.5rem] border border-white/5 p-6 shadow-xl">
                                    <LegislativeNetwork data={process.graph} />
                                </div>
                            </section>
                        )}

                        {/* Quick Stats / Info */}
                        <section className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5">
                            <h3 className="text-xs font-black text-secondary/40 uppercase tracking-[0.2em] mb-6">Archiwum Metadanych</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <span className="text-xs font-bold text-secondary">Identyfikator Procesu</span>
                                    <span className="text-[10px] font-mono text-secondary group-hover:text-primary">{id}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <span className="text-xs font-bold text-secondary">Źródło Danych Rejestru</span>
                                    <span className="text-[10px] font-mono text-indigo-400 uppercase">Sejm API v1</span>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default LegislativeProcessDetails;
