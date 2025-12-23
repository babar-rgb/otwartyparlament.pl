import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MP } from '../api';

interface FeaturedMPsProps {
    topAttendance: MP[];
    topRebels: MP[];
    lowAttendance: MP[];
}

interface MiniMPCardProps {
    mp: MP;
    metric: string;
    metricValue: number;
    index: number;
    variant: 'positive' | 'neutral' | 'negative';
}

function MiniMPCard({ mp, metric, metricValue, index, variant }: MiniMPCardProps) {
    const variantStyles = {
        positive: 'text-emerald-600',
        neutral: 'text-blue-600',
        negative: 'text-rose-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link to={`/poslowie/${mp.slug || mp.id}`}>
                <div className="group flex-shrink-0 w-36 bg-white border border-slate-200 rounded-xl hover:shadow-lg hover:border-slate-300 transition-all duration-200 overflow-hidden">
                    {/* Photo */}
                    <div className="aspect-[4/5] overflow-hidden bg-slate-100 relative">
                        <img
                            src={mp.photo_url || `https://ui-avatars.com/api/?name=${mp.first_name}+${mp.last_name}&background=e2e8f0&color=475569`}
                            alt={`${mp.first_name} ${mp.last_name}`}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Rank badge */}
                        <div className={`absolute top-2 left-2 w-6 h-6 rounded-md flex items-center justify-center shadow-sm ${index < 3 ? 'bg-blue-600 text-white' : 'bg-white/90 text-slate-600'
                            }`}>
                            <span className="text-xs font-bold">
                                {index + 1}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                        <h4 className="font-bold text-slate-900 text-xs leading-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {mp.first_name} {mp.last_name}
                        </h4>
                        <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-slate-100">
                            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-medium">{metric}</span>
                            <span className={`text-base font-bold ${variantStyles[variant]}`}>
                                {metricValue}%
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function FeaturedMPs({ topAttendance, topRebels, lowAttendance }: FeaturedMPsProps) {
    const sections = [
        {
            title: "Liderzy Aktywności",
            subtitle: "Najwyższa frekwencja",
            mps: topAttendance,
            metric: "obecność",
            variant: 'positive' as const,
        },
        {
            title: "Najwięcej Buntów",
            subtitle: "Głosowali wbrew partii",
            mps: topRebels,
            metric: "bunty",
            variant: 'neutral' as const,
        },
        {
            title: "Najniższa Frekwencja",
            subtitle: "Rzadko obecni",
            mps: lowAttendance,
            metric: "obecność",
            variant: 'negative' as const,
        },
    ];

    return (
        <div className="mb-12">
            {/* Section header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                    <div className="w-8 h-[1px] bg-slate-300"></div>
                    Wyróżnieni
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Rankingi Posłów</h2>
                <p className="text-slate-500 text-sm mt-1">Na podstawie danych z API Sejmu RP</p>
            </div>

            <div className="space-y-8">
                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                        <div className="mb-3 flex items-baseline gap-4">
                            <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{section.subtitle}</span>
                        </div>

                        {/* Horizontal scrollable container */}
                        <div className="relative -mx-4 px-4">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {section.mps.map((mp, index) => (
                                    <MiniMPCard
                                        key={mp.id}
                                        mp={mp}
                                        metric={section.metric}
                                        metricValue={
                                            section.metric === "obecność"
                                                ? mp.attendanceRate || 0
                                                : mp.rebelVotes || 0
                                        }
                                        variant={section.variant}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                    <div className="w-8 h-[1px] bg-slate-300"></div>
                    Baza danych
                </div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Wszyscy Posłowie</h3>
                <p className="text-slate-500 text-sm mt-1">Pełna lista posłów bieżącej kadencji</p>
            </div>
        </div>
    );
}
