import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchVoteTimeline } from '../api';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface VotingTimelineProps {
    term: number;
    onSittingSelect: (sitting: number) => void;
    currentSitting: number | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-surface/95 backdrop-blur-md border border-border-base p-3 rounded-xl shadow-xl text-xs">
                <p className="font-bold text-primary mb-1">Posiedzenie {data.sitting}</p>
                <p className="text-secondary mb-2">{data.date}</p>
                <div className="space-y-1">
                    <div className="flex justify-between gap-4">
                        <span className="text-emerald-500 font-medium">Przyjęto:</span>
                        <span className="font-bold text-primary">{data.adopted}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-rose-500 font-medium">Odrzucono:</span>
                        <span className="font-bold text-primary">{data.rejected}</span>
                    </div>
                    <div className="pt-1 mt-1 border-t border-border-base flex justify-between gap-4 text-xs">
                        <span className="text-secondary">Razem:</span>
                        <span className="font-bold text-primary">{data.count}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const VotingTimeline = ({ term, onSittingSelect, currentSitting }: VotingTimelineProps) => {
    const { data: timelineData, isLoading } = useQuery({
        queryKey: ['voteTimeline', term],
        queryFn: () => fetchVoteTimeline(term),
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const [hoveredSitting, setHoveredSitting] = useState<number | null>(null);

    // If data is loading or empty
    if (isLoading) {
        return (
            <div className="h-32 w-full flex items-center justify-center bg-surface/30 rounded-2xl border border-border-base/40">
                <Loader2 className="animate-spin text-secondary" size={20} />
            </div>
        );
    }

    if (!timelineData || timelineData.length === 0) return null;

    return (
        <div className="w-full bg-surface/40 backdrop-blur-sm border border-border-base rounded-[var(--radius-card-lg)] p-4 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">
                    Aktywność Legislacyjna (Posiedzenia)
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-secondary font-medium">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
                        Głosowania
                    </span>
                </div>
            </div>

            <div className="h-24 md:h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={timelineData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        onMouseMove={(state: any) => {
                            if (state.activePayload) {
                                setHoveredSitting(state.activePayload[0].payload.sitting);
                            } else {
                                setHoveredSitting(null);
                            }
                        }}
                        onMouseLeave={() => setHoveredSitting(null)}
                        onClick={(state: any) => {
                            if (state && state.activePayload) {
                                onSittingSelect(state.activePayload[0].payload.sitting);
                            }
                        }}
                    >
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <XAxis
                            dataKey="sitting"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#64748b' }}
                            interval="preserveStartEnd"
                            minTickGap={20}
                        />
                        <Bar
                            dataKey="count"
                            radius={[4, 4, 4, 4]}
                            className="transition-all duration-300 cursor-pointer"
                        >
                            {timelineData.map((entry: any, index: number) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.sitting === currentSitting
                                            ? '#3b82f6' // Active Blue
                                            : hoveredSitting === entry.sitting
                                                ? '#60a5fa' // Hover Light Blue
                                                : '#1e293b' // Default Slate (Dark) / Slate-200 (Light needs adjustment if strict light mode needed)
                                    }
                                    stroke={entry.sitting === currentSitting ? '#2563eb' : 'transparent'}
                                    strokeWidth={2}
                                    className="dark:fill-slate-800 dark:hover:fill-blue-500/50 transition-all duration-300"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default VotingTimeline;
