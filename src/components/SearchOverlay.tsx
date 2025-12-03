import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            // Small delay to ensure animation has started/DOM is ready
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

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        // For now, we can redirect to a search results page or just the MPs page with a query param
        // Since we don't have a dedicated global search page yet, let's redirect to /poslowie with the search term
        // Ideally, we would have a global search page.
        // But based on the current app structure, searching for MPs is the primary use case.
        // Let's navigate to /poslowie and maybe we can pass state or query param.
        // The Poslowie page uses local state for search, so we might need to update it to read from URL.
        // For this step, I'll just close the overlay and maybe log it, or navigate to /poslowie?
        // Let's navigate to /poslowie?search=query

        navigate(`/poslowie?q=${encodeURIComponent(query)}`);
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-paper/95 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Search Container */}
            <div className="relative w-full max-w-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ink-light" size={32} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Szukaj posła, głosowania, tematu..."
                        className="w-full bg-transparent text-3xl md:text-4xl font-bold text-ink placeholder:text-ink/20 border-b-2 border-ink/10 py-6 pl-20 pr-20 focus:outline-none focus:border-brand transition-colors"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-ink/5 rounded-full transition-colors text-ink-light"
                    >
                        <X size={28} />
                    </button>
                </form>

                {/* Quick Suggestions (Static for now, can be dynamic later) */}
                <div className="mt-8 pl-20">
                    <p className="text-sm font-bold text-ink-light uppercase tracking-wider mb-4">Popularne wyszukiwania</p>
                    <div className="flex flex-wrap gap-3">
                        {['Głosowania', 'Frekwencja', 'Budżet 2024', 'Donald Tusk', 'Mateusz Morawiecki'].map((tag) => (
                            <button
                                key={tag}
                                onClick={() => {
                                    setQuery(tag);
                                    // Optional: auto-search on click
                                    // handleSearch(); 
                                }}
                                className="px-4 py-2 bg-white border border-ink/10 rounded-full text-ink hover:border-brand hover:text-brand transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
