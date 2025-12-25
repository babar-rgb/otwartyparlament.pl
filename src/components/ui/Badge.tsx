import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'party';
    partyColor?: string;
    size?: 'sm' | 'md';
    className?: string;
}

const variantStyles = {
    default: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    party: '', // Uses partyColor prop
};

const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    partyColor,
    size = 'sm',
    className = '',
}) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full border';

    const style = variant === 'party' && partyColor
        ? { backgroundColor: `${partyColor}20`, color: partyColor, borderColor: `${partyColor}40` }
        : {};

    return (
        <span
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            style={style}
        >
            {children}
        </span>
    );
};

export default Badge;
