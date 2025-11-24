import { motion } from 'framer-motion';

interface SkeletonCardProps {
    count?: number;
}

export default function SkeletonCard({ count = 1 }: SkeletonCardProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    className="bg-white rounded-lg overflow-hidden border border-gray-200 animate-pulse"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                >
                    {/* Photo skeleton */}
                    <div className="w-full aspect-[3/4] bg-gray-200" />

                    {/* Content skeleton */}
                    <div className="p-4 space-y-3">
                        {/* Name */}
                        <div className="h-4 bg-gray-200 rounded w-3/4" />

                        {/* Stats */}
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <div className="h-3 bg-gray-200 rounded w-1/3" />
                                <div className="h-3 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="h-2 bg-gray-200 rounded-sm w-full" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </>
    );
}
