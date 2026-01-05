import { useTerm } from '../../context/TermContext';
import { motion } from 'framer-motion';

export default function TermSwitcher() {
    const { term, setTerm } = useTerm();

    return (
        <div className="flex items-center gap-3">
            <span className="hidden lg:block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Kadencja
            </span>
            <div className="relative flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full shadow-inner">
                <button
                    onClick={() => setTerm(10)}
                    className={`relative z-10 px-4 py-1.5 text-xs font-bold rounded-full transition-colors duration-200 ${term === 10 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                >
                    {term === 10 && (
                        <motion.div
                            layoutId="active-term"
                            className="absolute inset-0 bg-white dark:bg-slate-600 rounded-full shadow-sm"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">X (2023-)</span>
                </button>

                <button
                    onClick={() => setTerm(9)}
                    className={`relative z-10 px-4 py-1.5 text-xs font-bold rounded-full transition-colors duration-200 ${term === 9 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                        }`}
                >
                    {term === 9 && (
                        <motion.div
                            layoutId="active-term"
                            className="absolute inset-0 bg-white dark:bg-slate-600 rounded-full shadow-sm"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                    <span className="relative z-10">IX (2019-2023)</span>
                </button>
            </div>
        </div>
    );
}
