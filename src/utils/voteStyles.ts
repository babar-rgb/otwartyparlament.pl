
export const getCategoryStyles = (topic: string = '') => {
    const t = (topic || '').toLowerCase();

    // MAPPING TO 'FOR YOU' PALETTE
    // P: Blue/Cyan
    if (t.includes('gospodarka') || t.includes('finans') || t.includes('podat') || t.includes('budżet') || t.includes('infrastruktura'))
        return {
            bg: 'bg-blue-50/50 dark:bg-blue-900/10',
            border: 'border-blue-200 dark:border-blue-500/20',
            text: 'text-blue-600 dark:text-blue-400',
            gradient: 'from-blue-500 to-cyan-500',
            badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
        };
    // R: Rose/Red
    if (t.includes('rodzin') || t.includes('społecz') || t.includes('pomoc') || t.includes('ukraiń'))
        return {
            bg: 'bg-rose-50/50 dark:bg-rose-900/10',
            border: 'border-rose-200 dark:border-rose-500/20',
            text: 'text-rose-600 dark:text-rose-400',
            gradient: 'from-rose-500 to-red-500',
            badge: 'bg-rose-100/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
        };
    // P: Emerald/Teal
    if (t.includes('praca') || t.includes('zdrow'))
        return {
            bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
            border: 'border-emerald-200 dark:border-emerald-500/20',
            text: 'text-emerald-600 dark:text-emerald-400',
            gradient: 'from-emerald-500 to-teal-500',
            badge: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
        };
    // R: Yellow/Orange
    if (t.includes('rolnic') || t.includes('środow') || t.includes('klimat') || t.includes('energet'))
        return {
            bg: 'bg-orange-50/50 dark:bg-orange-900/10',
            border: 'border-orange-200 dark:border-orange-500/20',
            text: 'text-orange-600 dark:text-orange-400',
            gradient: 'from-yellow-500 to-orange-500',
            badge: 'bg-orange-100/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
        };
    // S: Indigo/Violet
    if (t.includes('edukac') || t.includes('nauk') || t.includes('cyfryz'))
        return {
            bg: 'bg-indigo-50/50 dark:bg-indigo-900/10',
            border: 'border-indigo-200 dark:border-indigo-500/20',
            text: 'text-indigo-600 dark:text-indigo-400',
            gradient: 'from-indigo-500 to-violet-500',
            badge: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
        };
    // E: Purple/Pink
    if (t.includes('państw') || t.includes('praw') || t.includes('obronn') || t.includes('ustrój'))
        return {
            bg: 'bg-purple-50/50 dark:bg-purple-900/10',
            border: 'border-purple-200 dark:border-purple-500/20',
            text: 'text-purple-600 dark:text-purple-400',
            gradient: 'from-purple-500 to-pink-500',
            badge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
        };

    // General
    // General (Inne / Ogólne)
    return {
        bg: 'bg-surface hover:bg-black/5 dark:hover:bg-white/5',
        border: 'border-transparent',
        text: 'text-secondary/60',
        gradient: 'from-slate-500/20 to-slate-400/20',
        badge: 'bg-transparent text-secondary/40 border border-transparent'
    };
};
