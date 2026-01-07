import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Expert Scroll Restoration Hook
 * Automatically saves and restores scroll positions per route using sessionStorage.
 * This replaces brittle manual flags like isReturningFromMp.
 */
export const useScrollRestoration = () => {
    const { pathname } = useLocation();
    const navType = useNavigationType();
    const scrollPositions = useRef<Record<string, number>>({});

    useEffect(() => {
        // Restore scroll on POP (back/forward)
        if (navType === 'POP') {
            const savedPosition = sessionStorage.getItem(`scroll_${pathname}`);
            if (savedPosition) {
                // Use a small timeout to ensure DOM is rendered (especially for lazy loaded content)
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedPosition, 10));
                }, 50);
            }
        } else {
            // New navigation: scroll to top
            window.scrollTo(0, 0);
        }

        // Save scroll position on unmount or before location change
        const handleScroll = () => {
            sessionStorage.setItem(`scroll_${pathname}`, window.scrollY.toString());
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [pathname, navType]);
};
