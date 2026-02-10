
interface SkeletonProps {
    className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
    return (
        <div
            className={`bg-border-base/10 rounded-lg animate-pulse ${className}`}
        />
    );
}
