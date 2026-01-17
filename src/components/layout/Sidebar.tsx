import { Link, useNavigate } from 'react-router-dom';
import { X, Github, Mail, BookOpen, Database, Heart, Search, Users, Briefcase, CheckSquare, BarChart3, FileText, Globe, Wallet, Building2, Eye, Minimize2, Maximize2, HelpCircle, Activity } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const navigate = useNavigate();
    const { isSimpleMode, toggleSimpleMode, fontSize, setFontSize } = useAccessibility();

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
                className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-surface z-50 shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-border-base ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header with Close Button */}
                    <div className="flex justify-between items-center p-6 border-b border-border-base bg-surface">
                        <h2 className="text-2xl font-black text-primary">Menu</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-page rounded-xl transition-colors text-primary"
                            aria-label="Zamknij menu"
                        >
                            <X size={24} strokeWidth={2.5} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Section A: Transparentność i Misja */}
                        <div className="mb-8">
                            {/* Mobile Search Input */}
                            <div className="mb-6 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
                                <input
                                    type="text"
                                    placeholder="Szukaj..."
                                    className="w-full pl-10 pr-4 py-3 bg-page border border-border-base rounded-xl text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-accent-blue transition-all"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.trim()) {
                                                navigate(`/ szukaj ? q = ${encodeURIComponent(target.value)} `);
                                                onClose();
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4 px-3">
                                Główna Nawigacja
                            </h3>
                            <nav className="space-y-1 mb-8">
                                <Link to="/poslowie" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-page font-bold text-primary group transition-all">
                                    <Users size={18} className="text-secondary group-hover:text-accent-blue transition-colors" />
                                    Posłowie
                                </Link>
                                <Link to="/komisje" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-page font-bold text-primary group transition-all">
                                    <Briefcase size={18} className="text-secondary group-hover:text-accent-blue transition-colors" />
                                    Komisje
                                </Link>
                                <Link to="/glosowania" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-page font-bold text-primary group transition-all">
                                    <CheckSquare size={18} className="text-secondary group-hover:text-accent-blue transition-colors" />
                                    Głosowania
                                </Link>
                                <Link to="/rankingi" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-page font-bold text-primary group transition-all">
                                    <BarChart3 size={18} className="text-secondary group-hover:text-accent-blue transition-colors" />
                                    Rankingi
                                </Link>
                                <Link to="/test-wyborczy" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg bg-accent-blue/5 border border-accent-blue/10 hover:bg-accent-blue/10 font-black text-accent-blue group shadow-sm">
                                    <CheckSquare size={20} className="text-accent-blue group-hover:scale-110 transition-transform" />
                                    Test Wyborczy
                                </Link>
                                <Link to="/projekty" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-900 dark:text-white group">
                                    <FileText size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    Projekty
                                </Link>

                                <div className="border-t border-slate-100 dark:border-white/5 my-1 mx-3" />
                                {/* <Link to="/live" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-900 dark:text-white group">
                                    <Radio size={20} className="text-red-500 animate-pulse" />
                                    Live
                                </Link> */}
                            </nav>



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
                                        <div className="font-bold text-slate-900">O Projekcie / Misja</div>
                                        <div className="text-sm text-slate-600">Cele projektu</div>
                                    </div>
                                </Link>

                                <Link
                                    to="/metodologia"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <Database size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Metodologia i Weryfikacja</div>
                                        <div className="text-sm text-slate-600">Jak sprawdzamy dane?</div>
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

                        {/* Section: Dostępność / Accessibility */}
                        <div className="mb-8 p-4 bg-page rounded-2xl border border-border-base">
                            <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <Eye size={12} />
                                Dostępność
                            </h3>

                            <div className="space-y-3">
                                <button
                                    onClick={toggleSimpleMode}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSimpleMode
                                        ? 'bg-black text-white border-black ring-2 ring-offset-2 ring-black'
                                        : 'bg-surface text-primary border-border-base hover:bg-hover'
                                        }`}
                                >
                                    <span className="font-bold text-sm">Tryb Uproszczony</span>
                                    {isSimpleMode ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-black bg-yellow-400 text-black px-1.5 rounded">ON</span>
                                        </div>
                                    ) : (
                                        <div className="w-8 h-4 bg-border-base rounded-full" />
                                    )}
                                </button>

                                <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border-base">
                                    <button
                                        onClick={() => setFontSize(Math.max(0, fontSize - 1))}
                                        className="flex-1 p-2 hover:bg-hover rounded-lg text-secondary hover:text-primary transition-colors disabled:opacity-30"
                                        disabled={fontSize <= 0}
                                        aria-label="Zmniejsz tekst"
                                    >
                                        <Minimize2 size={16} className="mx-auto" />
                                    </button>
                                    <span className="font-mono font-bold text-xs w-12 text-center text-primary">
                                        {fontSize === 0 ? '100%' : fontSize === 1 ? '125%' : '150%'}
                                    </span>
                                    <button
                                        onClick={() => setFontSize(Math.min(2, fontSize + 1))}
                                        className="flex-1 p-2 hover:bg-hover rounded-lg text-secondary hover:text-primary transition-colors disabled:opacity-30"
                                        disabled={fontSize >= 2}
                                        aria-label="Powiększ tekst"
                                    >
                                        <Maximize2 size={16} className="mx-auto" />
                                    </button>
                                </div>
                            </div>
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
                                    to="/pomoc"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <HelpCircle size={20} className="text-accent-blue group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Centrum Pomocy</div>
                                        <div className="text-sm text-slate-600">Słownik pojęć, FAQ, Przewodnik</div>
                                    </div>
                                </Link>

                                <Link
                                    to="/kontakt"
                                    onClick={onClose}
                                    className="flex items-center gap-3 p-4 rounded-lg hover:bg-slate-50 transition-colors group"
                                >
                                    <BookOpen size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <div className="font-bold text-slate-900">Kontakt</div>
                                        <div className="text-sm text-slate-600">Masz pytania? Napisz!</div>
                                    </div>
                                </Link>
                            </nav>
                        </div>
                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                                Beta Funkcje <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">BETA</span>
                            </h3>
                            <nav className="space-y-2 mb-8">
                                <Link to="/procesy" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-900 dark:text-white group">
                                    <Activity size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                    Procesy
                                </Link>
                                <Link to="/transfery" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-900 dark:text-white group">
                                    <Wallet size={20} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                                    Mapa Transferów
                                </Link>
                                <Link to="/rzad" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-900 dark:text-white group">
                                    <Building2 size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    Efektywność Rządu
                                </Link>
                                {/* <Link to="/ai-twin" onClick={onClose} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-slate-900 dark:text-white group">
                                    <Sparkles size={20} className="text-accent-blue group-hover:scale-110 transition-transform" />
                                    AI Polityczny Bliźniak
                                </Link> */}
                                <Link to="/europarlament" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-page font-bold text-primary group transition-all">
                                    <Globe size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                                    Europarlament
                                </Link>
                            </nav>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border-base bg-page/50">
                        <p className="text-xs text-secondary text-center font-medium leading-relaxed">
                            Transparentna, niekomercyjna platforma stworzona dla demokracji
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
