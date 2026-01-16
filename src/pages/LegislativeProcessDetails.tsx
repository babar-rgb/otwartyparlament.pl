import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, FileText, Activity } from 'lucide-react';
import LegislativeProcessTimeline from '../components/features/analysis/LegislativeProcessTimeline';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface Stage {
    id: string;
    stage_type: string;
    title: string;
    description: string;
    date: string;
    bill_number?: string;
    vote_id?: number | null;
}

interface LegislativeProcess {
    id: string;
    title: string;
    start_date: string;
    status: string;
    stages: Stage[];
}

const LegislativeProcessDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [process, setProcess] = useState<LegislativeProcess | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProcess = async () => {
            if (!id) return;
            try {
                const response = await fetch(`http://localhost:3001/legislative_processes/${id}`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setProcess(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProcess();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-secondary animate-pulse">Ładowanie procesu...</div>
        </div>
    );

    if (!process) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-6">
            <h1 className="text-2xl font-bold text-primary mb-4">Nie znaleziono procesu</h1>
            <Link to="/procesy" className="text-indigo-400 hover:text-indigo-300">Wróć do listy</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-background font-sans text-primary pb-20 pt-24 px-6">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <Link to="/procesy" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Wróć do listy procesów
                </Link>

                <div className="bg-surface border border-border-base rounded-[2rem] p-8 md:p-12 shadow-sm mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex gap-4 mb-6">
                            <div className="px-3 py-1 bg-white/5 rounded-lg text-xs font-mono text-secondary flex items-center gap-2">
                                <Calendar size={12} />
                                Rozpoczęto: {format(new Date(process.start_date), 'dd MMMM yyyy', { locale: pl })}
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${process.status === 'IN_PROGRESS' ? 'bg-blue-500/20 text-blue-400' :
                                    process.status === 'SIGNED' ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-gray-500/20 text-gray-400'
                                }`}>
                                {process.status}
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                            {process.title}
                        </h1>

                        <div className="flex gap-4">
                            <button className="px-6 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-sm hover:bg-indigo-500/20 transition-colors flex items-center gap-2">
                                <FileText size={16} />
                                Zobacz dokumenty źródłowe
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-xl font-bold mb-8 px-4 border-l-4 border-indigo-500 flex items-center gap-3">
                        Przebieg Procesu Legislacyjnego
                        <span className="text-xs font-mono text-secondary font-normal opacity-50">ID: {process.id}</span>
                    </h2>

                    <div className="bg-[#1A1A1A] p-8 md:p-12 rounded-[2rem] border border-white/5 shadow-2xl">
                        <LegislativeProcessTimeline stages={process.stages} variant="full" />
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default LegislativeProcessDetails;
