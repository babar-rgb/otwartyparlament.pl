import { useTerm } from '../context/TermContext';

export default function TermSwitcher() {
    const { term, setTerm } = useTerm();

    return (
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide px-2">
                Kadencja:
            </span>
            <div className="flex gap-1">
                <button
                    onClick={() => setTerm(10)}
                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${term === 10
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                >
                    X (2023-)
                </button>
                <button
                    onClick={() => setTerm(9)}
                    className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all ${term === 9
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                        }`}
                >
                    IX (2019-2023)
                </button>
            </div>
        </div>
    );
}
