import { Link } from 'react-router-dom';
import { Vote } from '../api';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import * as Icons from 'lucide-react';

interface VoteCardProps {
  vote: Vote;
}

export default function VoteCard({ vote }: VoteCardProps) {
  const IconComponent = vote.categoryIcon ? (Icons[vote.categoryIcon as keyof typeof Icons] as any) : Icons.FileText;
  const resultColor = vote.result === 'przyjęto' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  const importanceColor = vote.importance >= 8 ? 'bg-red-100 text-red-800' : vote.importance >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';

  return (
    <Link to={`/glosowania/${vote.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 hover:shadow-lg hover:border-slate-300 transition p-4 cursor-pointer h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            {IconComponent && <IconComponent size={20} className="text-blue-600" />}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm">
                {vote.title}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${resultColor}`}>
                {vote.result || 'Nierozstrzygnięte'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {format(new Date(vote.date), 'd MMMM yyyy', { locale: pl })}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
          {vote.description || 'Brak opisu'}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${importanceColor}`}>
            Ważność: {vote.importance}/10
          </span>
          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
            {vote.topic || 'Ogólne'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs font-semibold text-green-600">{vote.for || 0}</p>
            <p className="text-xs text-slate-500">Za</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-red-600">{vote.against || 0}</p>
            <p className="text-xs text-slate-500">Przeciw</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-yellow-600">{vote.abstained || 0}</p>
            <p className="text-xs text-slate-500">Wstrzym.</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-600">{vote.absent || 0}</p>
            <p className="text-xs text-slate-500">Nieobecni</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
