import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm text-center max-w-lg">
                <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-400 mb-6">
                    <Ghost size={64} />
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                    Strona nie istnieje (404)
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                    Wygląda na to, że zabłądziłeś w sejmowych korytarzach. Ta strona została przeniesiona lub nigdy nie istniała.
                </p>

                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                    <ArrowLeft size={20} />
                    Wróć na stronę główną
                </Link>
            </div>
        </div>
    );
}
