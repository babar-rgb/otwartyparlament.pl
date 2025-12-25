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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mb-4">
                {description}
            </p>
            {action && <div>{action}</div>}
        </div>
    );
};

export default EmptyState;
