interface TopicCount {
    category: string;
    count: number;
}

interface TopicRadarProps {
    topics: TopicCount[];
    maxTopics?: number;
}

export default function TopicRadar({ topics, maxTopics = 5 }: TopicRadarProps) {
    if (!topics || topics.length === 0) {
        return null;
    }

    // Sort by count and take top N
    const sorted = [...topics]
        .sort((a, b) => b.count - a.count)
        .slice(0, maxTopics);

    const maxCount = sorted[0]?.count || 1;

    // Color palette for topics
    const colors = [
        'bg-blue-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-violet-500',
        'bg-rose-500',
        'bg-cyan-500',
        'bg-orange-500',
        'bg-indigo-500'
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                Radar Tematyczny
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                W czym ten poseł jest najbardziej aktywny?
            </p>

            <div className="space-y-3">
                {sorted.map((topic, idx) => {
                    const percentage = Math.round((topic.count / maxCount) * 100);
                    return (
                        <div key={topic.category} className="space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {topic.category}
                                </span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {topic.count}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
