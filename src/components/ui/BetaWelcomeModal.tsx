
import { useState, useEffect } from 'react';
import { X, MessageSquareQuote } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const BetaWelcomeModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const hasSeenBetaModal = localStorage.getItem('hasSeenBetaModal_v1');
        if (!hasSeenBetaModal) {
            // Show after a short delay for smooth entrance
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('hasSeenBetaModal_v1', 'true');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-0">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#1a1625] rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-purple-500/20 overflow-hidden"
                    >
                        {/* Decorative background blob */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10">
                            <button
                                onClick={handleClose}
                                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 transform rotate-3">
                                    <MessageSquareQuote className="text-white" size={32} />
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    Cześć! 👋
                                </h2>

                                <div className="prose-sm text-slate-600 dark:text-slate-300 space-y-3 mb-8 leading-relaxed">
                                    <p>
                                        Dzięki, że wchodzisz na moją stronę.
                                        Projekt znajduje się obecnie w fazie <strong className="text-purple-600 dark:text-purple-400">Beta</strong> – to oznacza, że wciąż go udoskonalam.
                                    </p>
                                    <p>
                                        Mam do Ciebie prośbę: po zapoznaniu się z serwisem, wypełnij proszę krótką ankietę.
                                        Znajdziesz ją w <strong>prawym górnym rogu</strong> ekranu (przycisk "Twoja Opinia").
                                    </p>
                                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                        💡 PS. Serwis najlepiej wygląda na komputerze – tam znajdziesz pełne analizy i wykresy!
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                        � PS. Wiem, że strona może momentami zamulać – to wersja Beta na serwerze za 5 dolarów. Niedługo będę ulepszał całą architekturę!
                                    </p>
                                    <p className="text-xs opacity-70">
                                        Twój feedback pomoże mi dostosować user experience i poprawić wszelkie błędy. Z góry dziękuję!
                                    </p>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="w-full sm:w-auto px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform duration-200"
                                >
                                    Rozumiem, wchodzę!
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BetaWelcomeModal;
