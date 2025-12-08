import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface FollowButtonProps {
    mpId: number;
    mpName: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function FollowButton({ mpId, mpName, size = 'md' }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Load state from localStorage
    useEffect(() => {
        const following = JSON.parse(localStorage.getItem('followedMPs') || '[]');
        setIsFollowing(following.includes(mpId));
    }, [mpId]);

    const toggleFollow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const following = JSON.parse(localStorage.getItem('followedMPs') || '[]');

        if (isFollowing) {
            const updated = following.filter((id: number) => id !== mpId);
            localStorage.setItem('followedMPs', JSON.stringify(updated));
            setIsFollowing(false);
        } else {
            following.push(mpId);
            localStorage.setItem('followedMPs', JSON.stringify(following));
            setIsFollowing(true);
            // Trigger animation
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 600);
        }
    };

    const sizeClasses = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-3'
    };

    const iconSizes = {
        sm: 16,
        md: 20,
        lg: 24
    };

    return (
        <button
            onClick={toggleFollow}
            className={`
        relative rounded-full transition-all duration-300
        ${sizeClasses[size]}
        ${isFollowing
                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-rose-500 dark:hover:text-rose-400'
                }
        focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900
      `}
            aria-label={isFollowing ? `Przestań obserwować ${mpName}` : `Obserwuj ${mpName}`}
            aria-pressed={isFollowing}
        >
            <Heart
                size={iconSizes[size]}
                className={`
          transition-all duration-300
          ${isFollowing ? 'fill-current' : ''}
          ${isAnimating ? 'scale-125' : 'scale-100'}
        `}
            />

            {/* Pulse animation on follow */}
            {isAnimating && (
                <span className="absolute inset-0 rounded-full bg-rose-400 dark:bg-rose-500 animate-ping opacity-50" />
            )}
        </button>
    );
}
