
interface SkeletonProps {
    className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg ${className}`}
        />
    );
}
