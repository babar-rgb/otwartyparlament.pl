import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="relative p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            aria-label={`Toggle to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, rotate: 45, opacity: 0 }}
                        animate={{ y: 0, rotate: 0, opacity: 1 }}
                        exit={{ y: -20, rotate: -45, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'backOut' }}
                    >
                        <Moon className="w-5 h-5 text-amber-200" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, rotate: -45, opacity: 0 }}
                        animate={{ y: 0, rotate: 0, opacity: 1 }}
                        exit={{ y: -20, rotate: 45, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'backOut' }}
                    >
                        <Sun className="w-5 h-5 text-amber-500" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gloss effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
};

export default ThemeToggle;
