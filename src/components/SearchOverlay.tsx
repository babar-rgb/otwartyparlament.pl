import { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, FileText, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartSuggestions from './SmartSuggestions';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FilterChip {
    id: string;
    label: string;
    icon: typeof Calendar;
    param: string;
}

const FILTER_CHIPS: FilterChip[] = [
    { id: 'week', label: 'Ostatni Tydzień', icon: Calendar, param: 'period=week' },
    { id: 'laws', label: 'Tylko Ustawy', icon: FileText, param: 'type=process' },
    { id: 'controversial', label: 'Kontrowersyjne', icon: Flame, param: 'controversial=true' },
];

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const toggleFilter = (filterId: string) => {
        setActiveFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filterId)) {
                newSet.delete(filterId);
            } else {
                newSet.add(filterId);
            }
            return newSet;
        });
    };

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        // Build query string with filters
        const params = new URLSearchParams();
        params.set('q', query);

        activeFilters.forEach(filterId => {
            const chip = FILTER_CHIPS.find(c => c.id === filterId);
            if (chip) {
                const [key, value] = chip.param.split('=');
                params.set(key, value);
            }
        });

        navigate(`/szukaj?${params.toString()}`);
        onClose();
        setQuery('');
        setActiveFilters(new Set());
    };

    const handleSuggestionSelect = () => {
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 md:pt-28 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-paper/98 dark:bg-slate-950/98 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Search Container */}
            <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={28} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Szukaj posła, głosowania, ustawy..."
                        className="w-full bg-white dark:bg-slate-800 text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-5 pl-16 pr-14 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-lg transition-all"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 dark:text-slate-500"
                    >
                        <X size={24} />
                    </button>
                </form>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2 mt-4 px-2">
                    {FILTER_CHIPS.map((chip) => {
                        const Icon = chip.icon;
                        const isActive = activeFilters.has(chip.id);
                        return (
                            <button
                                key={chip.id}
                                onClick={() => toggleFilter(chip.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {chip.label}
                            </button>
                        );
                    })}
                </div>

                {/* Smart Suggestions */}
                <SmartSuggestions query={query} onSelect={handleSuggestionSelect} />

                {/* Keyboard hint */}
                <div className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Enter</span>
                    <span className="mx-2">aby przeszukać wszystko</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Esc</span>
                    <span className="mx-2">aby zamknąć</span>
                </div>
            </div>
        </div>
    );
}

