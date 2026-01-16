import React, { useEffect, useState } from 'react';
import LegislativeProcessTimeline from './LegislativeProcessTimeline';

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
    stages: Stage[];
}

interface LegislativeMetroProps {
    voteId: number;
}

const LegislativeMetro: React.FC<LegislativeMetroProps> = ({ voteId }) => {
    const [process, setProcess] = useState<LegislativeProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchProcess = async () => {
            try {
                const response = await fetch(`http://localhost:8000/votes/${voteId}/legislative_process`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setProcess(null);
                        setLoading(false);
                        return;
                    }
                    throw new Error("Failed to fetch");
                }
                const data = await response.json();
                setProcess(data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProcess();
    }, [voteId]);

    if (loading) return <div className="p-4 text-center text-sm text-gray-400 opacity-50 animate-pulse">Analiza osi czasu...</div>;
    if (error) return null;
    if (!process || !process.stages || process.stages.length === 0) return null;

    return (
        <div className="bg-[#1A1A1A] p-6 rounded-2xl border border-white/5 shadow-xl my-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex justify-between items-center">
                <span>Oś Czasu</span>
                <span className="text-[10px] opacity-50 font-mono">{process.id.slice(0, 8)}</span>
            </h3>

            <LegislativeProcessTimeline stages={process.stages} currentVoteId={voteId} variant="compact" />

            {/* Footer / Link to full view */}
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                <a href={`/procesy/${process.id}`} className="text-xs text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest font-bold">
                    Zobacz Pełną Historię &rarr;
                </a>
            </div>
        </div>
    );
};

export default LegislativeMetro;
