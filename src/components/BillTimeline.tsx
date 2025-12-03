import { CheckCircle2, Circle, Clock } from 'lucide-react';

export type TimelineStage = 'submitted' | 'reading1' | 'committee' | 'reading2' | 'voting' | 'senate' | 'president';

interface BillTimelineProps {
    currentStage: TimelineStage;
    status: 'processing' | 'passed' | 'rejected';
}

const stages: { id: TimelineStage; label: string }[] = [
    { id: 'submitted', label: 'Wpłynięcie' },
    { id: 'reading1', label: 'I Czytanie' },
    { id: 'committee', label: 'Komisja' },
    { id: 'reading2', label: 'II Czytanie' },
    { id: 'voting', label: 'Głosowanie' },
    { id: 'senate', label: 'Senat' },
    { id: 'president', label: 'Prezydent' },
];

export default function BillTimeline({ currentStage, status }: BillTimelineProps) {
    const getCurrentStageIndex = () => {
        return stages.findIndex((s) => s.id === currentStage);
    };

    const currentIndex = getCurrentStageIndex();

    return (
        <div className="w-full py-8 overflow-x-auto">
            <div className="min-w-[800px] px-4">
                <div className="relative flex items-center justify-between">
                    {/* Progress Bar Background */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full -z-10"></div>

                    {/* Active Progress Bar */}
                    <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full -z-10 transition-all duration-1000 ${status === 'rejected' ? 'bg-red-500' : 'bg-green-500'
                            }`}
                        style={{
                            width: `${(currentIndex / (stages.length - 1)) * 100}%`,
                        }}
                    ></div>

                    {/* Steps */}
                    {stages.map((stage, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;

                        return (
                            <div key={stage.id} className="flex flex-col items-center gap-3 relative group">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500 bg-white z-10 ${isCompleted
                                        ? 'border-green-500 text-green-500'
                                        : isCurrent
                                            ? status === 'rejected'
                                                ? 'border-red-500 text-red-500 scale-110 shadow-lg shadow-red-100'
                                                : 'border-blue-500 text-blue-500 scale-110 shadow-lg shadow-blue-100'
                                            : 'border-slate-200 text-slate-300'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 size={20} strokeWidth={3} />
                                    ) : isCurrent ? (
                                        status === 'passed' ? (
                                            <CheckCircle2 size={20} strokeWidth={3} className="text-green-500" />
                                        ) : status === 'rejected' ? (
                                            <Circle size={20} strokeWidth={3} className="text-red-500" />
                                        ) : (
                                            <Clock size={20} strokeWidth={3} className="animate-pulse" />
                                        )
                                    ) : (
                                        <Circle size={20} strokeWidth={3} />
                                    )}
                                </div>

                                <div className="absolute top-14 text-center w-32">
                                    <p
                                        className={`text-xs font-bold uppercase tracking-wide transition-colors ${isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                                            }`}
                                    >
                                        {stage.label}
                                    </p>
                                    {isCurrent && (
                                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 animate-fade-in">
                                            {status === 'processing' && 'W toku'}
                                            {status === 'passed' && 'Przyjęto'}
                                            {status === 'rejected' && 'Odrzucono'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
