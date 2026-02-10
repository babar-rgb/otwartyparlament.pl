
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function HelpButton() {
    const location = useLocation();

    // Don't show on HelpPage itself to avoid clutter
    if (location.pathname === '/pomoc') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed bottom-6 right-6 z-40 hidden md:block"
            >
                <Link
                    to="/pomoc"
                    className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-3 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-105 group"
                >
                    <HelpCircle size={24} className="group-hover:rotate-12 transition-transform" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap opacity-0 group-hover:opacity-100">
                        Potrzebujesz pomocy?
                    </span>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
}
