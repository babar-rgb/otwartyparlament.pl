import React from 'react';
import { CheckCircle2, XCircle, Vote } from 'lucide-react';

interface SocialShareCardProps {
    title: string;
    verdict: 'PRZYJĘTO' | 'ODRZUCONO';
    date: string;
    stats: {
        yes: number;
        no: number;
        abstain: number;
    };
    topicTag?: string;
}

const SocialShareCard: React.FC<SocialShareCardProps> = ({ title, verdict, date, stats, topicTag }) => {
    const isAccepted = verdict === 'PRZYJĘTO';

    return (
        <div
            id="social-share-card"
            className="w-[1080px] h-[1080px] bg-slate-950 p-20 flex flex-col justify-between relative overflow-hidden font-sans text-white border-[16px]"
            style={{
                borderColor: isAccepted ? '#10b981' : '#f43f5e',
                backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(30, 58, 138, 0.3) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(88, 28, 135, 0.3) 0%, transparent 50%)'
            }}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Header */}
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20">
                        <Vote size={48} className="text-white" />
                    </div>
                    <div>
                        <div className="text-xl font-black tracking-[0.3em] uppercase opacity-60">Otwarty Parlament</div>
                        <div className="text-sm font-bold text-blue-400 mt-1 uppercase tracking-widest">Weryfikacja Obywatelska</div>
                    </div>
                </div>
                {topicTag && (
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-2xl font-black uppercase tracking-widest text-blue-300">
                        #{topicTag}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col justify-center gap-12 relative z-10">
                <div className="space-y-6">
                    <div className="text-3xl font-bold text-slate-400 uppercase tracking-widest">{date}</div>
                    <h1 className="text-7xl font-black leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-400">
                        {title}
                    </h1>
                </div>

                {/* Verdict Box */}
                <div className={`p-16 rounded-[4rem] flex items-center justify-center gap-8 shadow-2xl ${isAccepted
                        ? 'bg-emerald-500/10 border-4 border-emerald-500 text-emerald-400 shadow-emerald-500/20'
                        : 'bg-rose-500/10 border-4 border-rose-500 text-rose-400 shadow-rose-500/20'
                    }`}>
                    {isAccepted ? <CheckCircle2 size={120} strokeWidth={2.5} /> : <XCircle size={120} strokeWidth={2.5} />}
                    <div className="text-[140px] font-black tracking-tighter uppercase leading-none">
                        {verdict}
                    </div>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-3 gap-8 relative z-10 border-t border-white/10 pt-16 mt-Auto">
                <div className="flex flex-col items-center">
                    <div className="text-7xl font-black text-emerald-400">{stats.yes}</div>
                    <div className="text-2xl font-bold uppercase tracking-widest opacity-50">ZA</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-7xl font-black text-rose-400">{stats.no}</div>
                    <div className="text-2xl font-bold uppercase tracking-widest opacity-50">PRZECIW</div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-7xl font-black text-amber-400">{stats.abstain}</div>
                    <div className="text-2xl font-bold uppercase tracking-widest opacity-50">WSTRZ.</div>
                </div>
            </div>

            {/* Bottom Watermark */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-2xl font-bold text-white/30 tracking-[0.5em] uppercase">
                otwartyparlament.pl
            </div>
        </div>
    );
};

export default SocialShareCard;
