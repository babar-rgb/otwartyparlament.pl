import { useTopics } from '../hooks/useTopics';
import { useTerm } from '../context/TermContext';
import { BarChart3, Briefcase, Calculator, Landmark, Shield, Stethoscope, Scale, Users, Leaf, Globe, Zap, Truck, School, Home, Phone, Anchor, Wheat } from 'lucide-react';

interface CategoryFilterGridProps {
    selectedTopic?: string;
    onSelectTopic: (topic: string | undefined) => void;
}

// Map common topics to Lucide icons
const TOPIC_ICONS: Record<string, any> = {
    'Gospodarka': Briefcase,
    'Finanse': Calculator,
    'Ustrój państwa': Landmark,
    'Ustrój': Landmark,
    'Obronność': Shield,
    'Zdrowie': Stethoscope,
    'Wymiar sprawiedliwości': Scale,
    'Sprawiedliwość': Scale,
    'Sprawy społeczne': Users,
    'Społeczeństwo': Users,
    'Rolnictwo': Wheat,
    'Środowisko': Leaf,
    'Ochrona środowiska': Leaf,
    'Kultura': Landmark,
    'Prawa człowieka': Scale,
    'Sprawy zagraniczne': Globe,
    'Energetyka': Zap,
    'Infrastruktura': Truck,
    'Edukacja': School,
    'Mieszkania': Home,
    'Cyfryzacja': Phone,
    'Gospodarka morska': Anchor
};

export const CategoryFilterGrid = ({ selectedTopic, onSelectTopic }: CategoryFilterGridProps) => {
    const { term } = useTerm();
    const { data: topics = [] } = useTopics(term);

    // Custom priority order for "Average Citizen" relevance
    const PRIORITY_ORDER = [
        'Gospodarka',
        'Zdrowie',
        'Społeczeństwo',
        'Finanse',
        'Obronność',
        'Edukacja',
        'Infrastruktura',
        'Środowisko',
        'Rolnictwo',
        'Ustrój',
        'Sprawiedliwość',
        'Kultura',
        'Sprawy zagraniczne',
        'Unia Europejska',
        'Energetyka',
        'Cyfryzacja'
    ];

    // Filter topics with significant votes using the new endpoint data
    const topTopics = topics
        .filter((t: any) => t.count > 0 && t.topic)
        .sort((a: any, b: any) => {
            const indexA = PRIORITY_ORDER.indexOf(a.topic);
            const indexB = PRIORITY_ORDER.indexOf(b.topic);

            // If both are in priority list, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;

            // If only A is in list, A comes first
            if (indexA !== -1) return -1;

            // If only B is in list, B comes first
            if (indexB !== -1) return 1;

            // Otherwise sort by count descending (default)
            return b.count - a.count;
        })
        .slice(0, 16);

    if (topTopics.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto pb-4 pt-2 no-scrollbar">
            <div className="flex gap-3 min-w-max px-1">
                {/* Reset Button */}
                <button
                    onClick={() => onSelectTopic(undefined)}
                    className={`
                        focus:outline-none focus:ring-0
                        flex flex-col items-center justify-center gap-2
                        w-24 h-24 rounded-2xl border transition-all duration-300
                        ${!selectedTopic
                            ? 'bg-accent-blue text-white border-accent-blue shadow-lg scale-105'
                            : 'bg-surface text-secondary border-border-base hover:border-accent-blue/30 hover:bg-black/5 dark:hover:bg-white/5'
                        }
                    `}
                >
                    <BarChart3 size={24} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Wszystkie</span>
                </button>

                {topTopics.map((item: any) => {
                    const Icon = TOPIC_ICONS[item.topic] || BarChart3;
                    const isSelected = selectedTopic === item.topic;

                    return (
                        <button
                            key={item.topic}
                            onClick={() => onSelectTopic(isSelected ? undefined : item.topic)}
                            className={`
                                focus:outline-none focus:ring-0
                                flex flex-col items-center justify-center gap-2 p-2
                                w-24 h-24 rounded-2xl border transition-all duration-300 group
                                ${isSelected
                                    ? 'bg-accent-blue text-white border-accent-blue shadow-lg scale-105'
                                    : 'bg-surface text-secondary border-border-base hover:border-accent-blue/30 hover:shadow-md hover:-translate-y-1'
                                }
                            `}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5 group-hover:bg-accent-blue/10 group-hover:text-accent-blue'}`}>
                                <Icon size={20} />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-center leading-tight line-clamp-2 px-1">
                                {item.topic}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
