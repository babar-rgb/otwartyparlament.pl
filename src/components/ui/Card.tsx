import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    padding = 'md',
    onClick,
}) => {
    const baseStyles = 'bg-white dark:bg-slate-800 rounded-xl border border-neutral-200 dark:border-slate-700';
    const hoverStyles = hover ? 'hover:shadow-lg hover:border-neutral-300 dark:hover:border-slate-600 transition-all cursor-pointer' : '';

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${paddingStyles[padding]} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`mb-4 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <h3 className={`text-lg font-semibold text-neutral-900 dark:text-neutral-100 ${className}`}>{children}</h3>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

export default Card;
