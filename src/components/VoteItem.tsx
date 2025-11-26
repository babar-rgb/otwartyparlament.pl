import { Link } from 'react-router-dom';

interface VoteItemProps {
    index: number;
    title: string;
    description: string;
    date: string;
    result: 'PRZYJĘTO' | 'ODRZUCONO';
    votesYes: number;
    votesNo: number;
    votesAbstain?: number;
}

export default function VoteItem({ index, title, description, date, result, votesYes, votesNo }: VoteItemProps) {
    const isAccepted = result === 'PRZYJĘTO';
    const totalVotes = votesYes + votesNo + (0); // Simplified for visual bar
    const yesPercent = Math.round((votesYes / totalVotes) * 100);
    const noPercent = Math.round((votesNo / totalVotes) * 100);

    return (
        <div className="flex flex-col md:flex-row gap-6 py-8 border-b border-gray-200 group hover:bg-slate-50 transition px-4 -mx-4 rounded-xl animate-in fade-in duration-500">
            <div className="flex-shrink-0 pt-1">
                <span className="text-3xl font-light text-slate-300 group-hover:text-ink transition duration-300">
                    {String(index).padStart(2, '0')}
                </span>
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-ink mb-2 group-hover:text-brand transition">
                    {title}
                </h3>
                <p className="text-slate-600 text-base leading-relaxed max-w-2xl mb-2">
                    {description}
                </p>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {date}
                </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-56 flex flex-col justify-center gap-3">
                <div className={`
          text-center py-1.5 rounded-full font-bold uppercase tracking-wider text-xs border
          ${isAccepted
                        ? 'bg-vote-yesBg text-vote-yes border-vote-yes/20'
                        : 'bg-vote-noBg text-vote-no border-vote-no/20'}
        `}>
                    {result}
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <span>Za: {votesYes}</span>
                        <span>Przeciw: {votesNo}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-vote-yes" style={{ width: `${yesPercent}%` }}></div>
                        <div className="h-full bg-vote-no" style={{ width: `${noPercent}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
