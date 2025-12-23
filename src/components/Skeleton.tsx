import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
    return (
        <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
    );
};

export const CardSkeleton: React.FC = () => (
    <div className="bg-[#111126] border border-white/5 rounded-[2rem] p-8 h-full flex items-center gap-6 relative z-10">
        <Skeleton className="w-16 h-16 rounded-2xl shrink-0" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
        </div>
    </div>
);

export const ChartSkeleton: React.FC = () => (
    <div className="bg-[#111126] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden h-full min-h-[400px] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg flex flex-col items-center">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="w-full h-48 rounded-t-full border-t-8 border-l-8 border-r-8 border-white/5" />
            <div className="flex gap-4 mt-8">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
            </div>
        </div>
    </div>
);
