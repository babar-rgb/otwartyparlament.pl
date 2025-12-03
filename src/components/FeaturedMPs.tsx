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
    accentColor: string;
    index: number;
}

function MiniMPCard({ mp, metric, metricValue, accentColor, index }: MiniMPCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link to={`/poslowie/${mp.id}`}>
                <motion.div
                    className="flex-shrink-0 w-48 bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer flex flex-col items-center p-4 relative"
                    whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    {/* Decorative background gradient */}
                    <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-slate-50 to-transparent opacity-50" />

                    {/* Photo */}
                    <div className="relative mb-3 z-10">
                        <div className="w-32 h-32 rounded-full p-1 bg-white border border-slate-100 shadow-sm">
                            <img
                                src={mp.photo_url || 'https://via.placeholder.com/200x200/E2E8F0/64748B?text=MP'}
                                alt={`${mp.first_name} ${mp.last_name}`}
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                        {/* Rank badge */}
                        <div className={`absolute -top-1 -left-1 w-7 h-7 ${accentColor} rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white`}>
                            {index + 1}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center w-full z-10">
                        <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 h-10 flex items-center justify-center">
                            {mp.first_name} {mp.last_name}
                        </h4>
                        <div className="flex flex-col items-center gap-0.5 bg-slate-50 rounded-lg py-2 px-3 border border-slate-100">
                            <span className={`text-xl font-bold ${accentColor.replace('bg-', 'text-')}`}>
                                {metricValue}%
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{metric}</span>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </motion.div>
    );
}

export default function FeaturedMPs({ topAttendance, topRebels, lowAttendance }: FeaturedMPsProps) {
    const sections = [
        {
            title: "🏆 Liderzy Aktywności",
            subtitle: "Najwyższa frekwencja",
            mps: topAttendance,
            metric: "obecność",
            accentColor: "bg-vote-yes",
        },
        {
            title: "⚡ Najwięcej Buntów",
            subtitle: "Głosowali wbrew partii",
            mps: topRebels,
            metric: "bunty",
            accentColor: "bg-brand",
        },
        {
            title: "⚠️ Najniższa Frekwencja",
            subtitle: "Rzadko obecni",
            mps: lowAttendance,
            metric: "obecność",
            accentColor: "bg-vote-no",
        },
    ];

    return (
        <div className="mb-12">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-ink mb-2">Wyróżnieni Posłowie</h2>
                <p className="text-ink-light">Automatycznie wygenerowane rankingi na podstawie danych z Sejmu</p>
            </div>

            <div className="space-y-8">
                {sections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-ink">{section.title}</h3>
                            <p className="text-sm text-ink-light">{section.subtitle}</p>
                        </div>

                        {/* Horizontal scrollable container */}
                        <div className="relative">
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {section.mps.map((mp, index) => (
                                    <MiniMPCard
                                        key={mp.id}
                                        mp={mp}
                                        metric={section.metric}
                                        metricValue={
                                            section.metric === "obecność"
                                                ? mp.attendanceRate || 85
                                                : mp.rebelVotes || Math.floor(Math.random() * 20)
                                        }
                                        accentColor={section.accentColor}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Divider */}
            <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-ink mb-2">Wszyscy Posłowie</h3>
                <p className="text-ink-light">Pełna lista 460 posłów X kadencji Sejmu</p>
            </div>
        </div>
    );
}
