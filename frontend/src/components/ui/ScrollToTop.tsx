import { useScrollRestoration } from '../../hooks/useScrollRestoration';

/**
 * ScrollToTop Component
 * Integrated with useScrollRestoration to provide seamless navigation context.
 */
export default function ScrollToTop() {
    useScrollRestoration();
    return null;
}
