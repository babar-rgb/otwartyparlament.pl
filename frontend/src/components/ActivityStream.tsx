import { Link } from 'react-router-dom';
import { Vote, MessageSquare, FileQuestion, Calendar } from 'lucide-react';

interface ActivityItem {
    type: 'vote' | 'speech' | 'interpellation';
    date: string;
    title: string;
    url: string;
    result?: string; // 'YES', 'NO', 'ABSTAIN' for votes
}

interface ActivityStreamProps {
    activities: ActivityItem[];
    maxItems?: number;
}

export default function ActivityStream({ activities, maxItems = 10 }: ActivityStreamProps) {
    // Sort by date descending
    const sorted = [...activities].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, maxItems);

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Brak zarejestrowanej aktywności.
            </div>
        );
    }

    const getIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'vote': return <Vote className="w-5 h-5" />;
            case 'speech': return <MessageSquare className="w-5 h-5" />;
            case 'interpellation': return <FileQuestion className="w-5 h-5" />;
        }
    };

    const getColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'vote': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
            case 'speech': return 'text-violet-600 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400';
            case 'interpellation': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
        }
    };

    const getLabel = (type: ActivityItem['type']) => {
        switch (type) {
            case 'vote': return 'Głosowanie';
            case 'speech': return 'Wypowiedź';
            case 'interpellation': return 'Interpelacja';
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Dziś';
        if (diffDays === 1) return 'Wczoraj';
        if (diffDays < 7) return `${diffDays} dni temu`;
        return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
    };

    const getVoteResultBadge = (result?: string) => {
        if (!result) return null;
        const colors = {
            'YES': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'NO': 'bg-red-100 text-red-700 border-red-200',
            'ABSTAIN': 'bg-amber-100 text-amber-700 border-amber-200',
            'ABSENT': 'bg-slate-100 text-slate-500 border-slate-200'
        };
        const labels = {
            'YES': 'ZA',
            'NO': 'PRZECIW',
            'ABSTAIN': 'WSTRZ.',
            'ABSENT': 'NIEOB.'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${colors[result as keyof typeof colors] || colors['ABSENT']}`}>
                {labels[result as keyof typeof labels] || result}
            </span>
        );
    };

    return (
        <div className="space-y-1">
            {sorted.map((activity, idx) => (
                <Link
                    key={`${activity.type}-${idx}`}
                    to={activity.url}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                    {/* Icon */}
                    <div className={`p-2 rounded-lg shrink-0 ${getColor(activity.type)}`}>
                        {getIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(activity.date)}
                            </span>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {getLabel(activity.type)}
                            </span>
                        </div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                            {activity.title}
                        </div>
                    </div>

                    {/* Vote result badge */}
                    {activity.type === 'vote' && getVoteResultBadge(activity.result)}
                </Link>
            ))}
        </div>
    );
}
