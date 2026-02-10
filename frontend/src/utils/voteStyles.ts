
export const getCategoryStyles = (topic: string = '') => {
    const t = (topic || '').toLowerCase();

    // 1. JUSTICE & LAW (Purple/Pink)
    if (t.includes('sprawiedliwośc') || t.includes('sądownictw') || t.includes('praw') || t.includes('trybunał') || t.includes('ustrój') || t.includes('konstytuc'))
        return {
            bg: 'bg-purple-50/50 dark:bg-purple-900/10',
            border: 'border-purple-200 dark:border-purple-500/20',
            text: 'text-purple-600 dark:text-purple-400',
            gradient: 'from-purple-500 to-pink-500',
            badge: 'bg-purple-100/80 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
        };

    // 2. ECONOMY & FINANCE (Blue/Cyan)
    if (t.includes('gospodarka') || t.includes('finans') || t.includes('podat') || t.includes('budżet') || t.includes('infrastruktura') || t.includes('pieniądz'))
        return {
            bg: 'bg-blue-50/50 dark:bg-blue-900/10',
            border: 'border-blue-200 dark:border-blue-500/20',
            text: 'text-blue-600 dark:text-blue-400',
            gradient: 'from-blue-500 to-cyan-500',
            badge: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
        };

    // 3. DEFENSE (Slate/Gray/Indigo - Strong)
    if (t.includes('obronn') || t.includes('wojsk') || t.includes('bezpieczeń'))
        return {
            bg: 'bg-slate-50/50 dark:bg-slate-800/20',
            border: 'border-slate-200 dark:border-slate-500/20',
            text: 'text-slate-600 dark:text-slate-400',
            gradient: 'from-slate-500 to-indigo-500',
            badge: 'bg-slate-100/80 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300'
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
