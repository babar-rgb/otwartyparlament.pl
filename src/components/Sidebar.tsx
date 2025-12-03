import { Link } from 'react-router-dom';
import { X, Github, Mail, BookOpen, Database, Heart, Search } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <>
            {/* Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header with Close Button */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-200">
                        <h2 className="text-2xl font-black text-slate-900">Menu</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            aria-label="Zamknij menu"
                        >
                            <X size={28} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Section A: Transparentność i Misja */}
                        <div className="mb-8">
                            {/* Mobile Search Input */}
                            <div className="mb-6 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Szukaj..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-100 rounded-lg text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.trim()) {
                                                window.location.href = `/poslowie?q=${encodeURIComponent(target.value)}`;
                                                onClose();
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                                Transparentność i Misja
                            </h3>
                            <nav className="space-y-2">
                                <Link
                                    to="/o-projekcie"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <Heart size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">O Projekcie / Nasza Misja</div>
                                        <div className="text-sm text-slate-600">Model non-profit i cele</div>
                                    </div>
                                </Link>

                                <Link
                                    to="/metodologia"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <Database size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Źródła Danych i Metodologia</div>
                                        <div className="text-sm text-slate-600">Sejm API, skrypty, AI</div>
                                    </div>
                                </Link>

                                <Link
                                    to="/open-source"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <Github size={20} className="text-slate-900 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Kod Źródłowy (Open Source)</div>
                                        <div className="text-sm text-slate-600">Zobacz na GitHub</div>
                                    </div>
                                </Link>
                            </nav>
                        </div>

                        {/* Section B: Pomoc i Kontakt */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                                Pomoc i Kontakt
                            </h3>
                            <nav className="space-y-2">
                                <Link
                                    to="/newsletter"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <Mail size={20} className="text-orange-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Newsletter</div>
                                        <div className="text-sm text-slate-600">Zapisz się na aktualizacje</div>
                                    </div>
                                </Link>

                                <Link
                                    to="/kontakt"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <BookOpen size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Kontakt / FAQ</div>
                                        <div className="text-sm text-slate-600">Masz pytania? Napisz!</div>
                                    </div>
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 bg-slate-50">
                        <p className="text-sm text-slate-600 text-center">
                            Projekt non-profit dla transparentności demokracji
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
