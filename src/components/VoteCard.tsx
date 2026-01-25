import { Link } from 'react-router-dom';
import { Vote } from '../api';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import * as Icons from 'lucide-react';

interface VoteCardProps {
  vote: Vote;
}

export default function VoteCard({ vote }: VoteCardProps) {
  const IconComponent = (vote.categoryIcon && Icons[vote.categoryIcon as keyof typeof Icons])
    ? Icons[vote.categoryIcon as keyof typeof Icons] as React.ComponentType<{ size?: number; className?: string }>
    : Icons.FileText;
  const getCategoryStyles = (topic: string = '') => {
    const t = topic.toLowerCase();
    if (t.includes('gospodarka') || t.includes('finans') || t.includes('podat') || t.includes('budżet'))
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/30',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
      };
    if (t.includes('rodzin') || t.includes('społecz') || t.includes('pomoc') || t.includes('ukraiń'))
      return {
        bg: 'bg-rose-50 dark:bg-rose-900/20',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800/30',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
      };
    if (t.includes('praca') || t.includes('zdrow'))
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/30',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      };
    if (t.includes('rolnic') || t.includes('środow') || t.includes('klimat') || t.includes('energet'))
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800/30',
        badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
      };
    if (t.includes('edukac') || t.includes('nauk') || t.includes('cyfryz'))
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/30',
        badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
      };
    if (t.includes('państw') || t.includes('praw') || t.includes('obronn') || t.includes('ustrój'))
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800/30',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
      };
    if (t.includes('infra') || t.includes('transport') || t.includes('budown'))
      return {
        bg: 'bg-slate-50 dark:bg-slate-800/20',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700/30',
        badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
      };

    return {
      bg: 'bg-slate-50 dark:bg-slate-800/20',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700/30',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    };
  };

  const styles = getCategoryStyles(vote.topic);
  const resultColor = vote.result === 'przyjęto' ? 'text-vote-yes bg-vote-yesBg' : 'text-vote-no bg-vote-noBg';
  const importance = vote.importance ?? 0;
  const importanceColor = importance >= 8 ? 'bg-red-100 text-red-800' : importance >= 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';

  return (
    <Link to={`/glosowania/${vote.id}`}>
      <div className={`bg-white dark:bg-slate-900/50 rounded-lg border ${styles.border} hover:border-brand transition p-4 cursor-pointer h-full relative overflow-hidden group`}>
        {/* Visual Wow Accent */}
        <div className={`absolute top-0 right-0 w-24 h-24 ${styles.bg} opacity-10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 transition-all group-hover:scale-150`} />

        <div className="flex items-start gap-3 mb-3 relative z-10">
          <div className={`w-10 h-10 ${styles.bg} rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
            {IconComponent && <IconComponent size={20} className={styles.text} />}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 text-sm">
                {vote.title}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${resultColor}`}>
                {vote.result || 'Nierozstrzygnięte'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {format(new Date(vote.date), 'd MMMM yyyy', { locale: pl })}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 relative z-10">
          {vote.description || 'Brak opisu'}
        </p>

        <div className="flex items-center gap-2 mb-3 relative z-10">
          <span className={`text-xs font-semibold px-2 py-1 rounded ${importanceColor}`}>
            Ważność: {vote.importance}/10
          </span>
          <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${styles.badge}`}>
            {vote.topic || 'Ogólne'}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-xs font-semibold text-green-600 dark:text-green-400">{vote.for || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Za</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">{vote.against || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Przeciw</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{vote.abstained || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Wstrzym.</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{vote.absent || 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Nieobecni</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
