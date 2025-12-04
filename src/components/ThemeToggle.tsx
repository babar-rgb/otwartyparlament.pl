import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative overflow-hidden"
            aria-label="Przełącz motyw"
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 360 : 0 }}
                transition={{ duration: 0.5, type: "spring" }}
            >
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.div>
        </button>
    );
}
