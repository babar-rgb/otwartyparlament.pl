import React from 'react';
import { FileX, Search, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
    title?: string;
    description?: string;
    icon?: 'search' | 'file' | 'error';
    action?: React.ReactNode;
}

const icons = {
    search: Search,
    file: FileX,
    error: AlertCircle,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = 'Brak wyników',
    description = 'Nie znaleziono pasujących elementów.',
    icon = 'file',
    action,
}) => {
    const Icon = icons[icon];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-[var(--radius-card-md)] bg-surface border border-border-base flex items-center justify-center mb-6 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-accent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-10 h-10 text-secondary" />
            </div>
            <h3 className="text-2xl font-black text-primary mb-3">
                {title}
            </h3>
            <p className="text-base text-secondary max-w-sm mb-8 font-medium leading-relaxed opacity-60">
                {description}
            </p>
            {action && <div className="animate-fade-in-up delay-200">{action}</div>}
        </div>
    );
};

export default EmptyState;
