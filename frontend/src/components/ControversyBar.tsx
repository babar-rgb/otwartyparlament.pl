import { Thermometer } from 'lucide-react';

interface ControversyBarProps {
    score: number; // 0-100
    showLabel?: boolean;
}

export default function ControversyBar({ score, showLabel = true }: ControversyBarProps) {
    // Determine color based on controversy level
    const getColor = () => {
        if (score < 30) return 'from-blue-400 to-blue-500';
        if (score < 60) return 'from-amber-400 to-orange-500';
        return 'from-orange-500 to-red-600';
    };

    const getLabel = () => {
        if (score < 30) return 'Zgodność';
        if (score < 60) return 'Dyskusja';
        return 'Kontrowersja';
    };

    const getTextColor = () => {
        if (score < 30) return 'text-blue-600 dark:text-blue-400';
        if (score < 60) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <div className="flex items-center gap-3">
            <Thermometer className={`w-4 h-4 ${getTextColor()}`} />
            {showLabel && (
                <span className={`text-xs font-bold uppercase tracking-wider ${getTextColor()}`}>
                    {getLabel()}
                </span>
            )}
            <div className="flex-grow h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${getColor()} transition-all duration-700`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                />
            </div>
            <span className={`text-sm font-bold ${getTextColor()}`}>
                {score}%
            </span>
        </div>
    );
}
