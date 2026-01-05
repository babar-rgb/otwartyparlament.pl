import { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, FileText, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SmartSuggestions from '../features/analysis/SmartSuggestions';
import { expandSearchQuery, handleSearchNavigation } from '../../utils/searchContext';

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
        handleSearchNavigation(navigate, query, activeFilters, FILTER_CHIPS);
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
                className="absolute inset-0 bg-page/98 dark:bg-black/98 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Search Container */}
            <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-secondary" size={28} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Szukaj posła, głosowania, ustawy..."
                        className="w-full bg-surface text-2xl md:text-3xl font-semibold text-primary placeholder:text-secondary border-2 border-border-base rounded-2xl py-5 pl-16 pr-14 focus:outline-none focus:border-accent-blue shadow-lg transition-all"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-black/5 rounded-full transition-colors text-secondary"
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
                                    ? 'bg-accent-blue text-white shadow-md'
                                    : 'bg-surface border border-border-base text-secondary hover:border-accent-blue'
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

