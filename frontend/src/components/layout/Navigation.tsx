import { Link } from 'react-router-dom';
import { Menu, X, Search, MessageSquareQuote, Activity, Sparkles, Home, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchOverlay from '../ui/SearchOverlay';
import { useAccessibility } from '../../context/AccessibilityContext';
import BetaWelcomeModal from '../ui/BetaWelcomeModal';

import ThemeToggle from '../ui/ThemeToggle';
// TermSwitcher removed

export default function Navigation() {
  const { isSimpleMode } = useAccessibility();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;

        // Show if scrolling up or at the top
        if (currentScrollY < lastScrollY || currentScrollY < 50) {
          setIsVisible(true);
        } else {
          // Hide if scrolling down and not at the top
          setIsVisible(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', controlNavbar);

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  return (
    <>
      <BetaWelcomeModal />
      <nav
        className={`fixed top-0 w-full z-50 py-6 transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${lastScrollY > 50
            ? 'bg-page/80 backdrop-blur-xl shadow-2xl py-4 border-b border-border-base'
            : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto max-w-screen-2xl px-6 md:px-12">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <Link to="/" className="font-extrabold text-2xl text-primary tracking-tight flex items-center gap-2">
              <span>otwartyparlament.pl</span>
            </Link>

            {/* Spacer for better separation */}
            <div className="hidden xl:block w-8 2xl:w-16" />

            {/* Center: Main Links (Desktop - Universal Adjustment) */}
            <div className="hidden lg:flex items-center gap-3 xl:gap-6 2xl:gap-8">
              {!isSimpleMode && (
                <>
                  <Link to="/poslowie" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Posłowie
                  </Link>

                  <Link to="/komisje" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Komisje
                  </Link>

                  <Link to="/glosowania" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Głosowania
                  </Link>

                  <Link to="/dla-ciebie" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Dla Ciebie
                  </Link>

                  <Link to="/rankingi" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Rankingi
                  </Link>
                  <Link to="/interpelacje" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Interpelacje
                  </Link>
                  <Link to="/projekty" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    Projekty
                  </Link>

                  <Link to="/o-projekcie" className="text-xs xl:text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200 whitespace-nowrap">
                    O Projekcie
                  </Link>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">

              {/* Feedback Button */}
              <a
                href="https://forms.gle/owu162jGe9GbQZ73A"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-full hover:bg-purple-700 transition-colors mr-2 shadow-lg shadow-purple-500/20"
              >
                <MessageSquareQuote size={14} />
                <span>Twoja Opinia</span>
              </a>

              <div className="hidden md:block">
                {/* TermSwitcher removed to avoid crowding */}
              </div>

              <ThemeToggle />

              {/* Search Button (Hidden on Mobile, moved to Bottom Bar) */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-primary hover:text-accent-blue transition-colors hidden md:block" // Hidden on mobile
                aria-label="Szukaj"
              >
                <Search size={22} strokeWidth={2} />
              </button>

              {/* Hamburger (Desktop/Tablet Only) - On Mobile we use Bottom Bar Menu */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-primary hover:text-accent-blue transition-colors hidden md:block"
                aria-label="Menu"
              >
                {isSidebarOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-xl border-t border-white/10 z-50 pb-safe">
        <div className="flex justify-around items-center p-3">
          <Link to="/" className="flex flex-col items-center gap-1 text-xs font-medium text-secondary hover:text-primary p-2">
            <div className="p-1 rounded-full bg-white/5"><Home size={20} className="w-5 h-5" /></div>
            <span>Start</span>
          </Link>
          <Link to="/poslowie" className="flex flex-col items-center gap-1 text-xs font-medium text-secondary hover:text-primary p-2">
            <Users size={20} className="text-blue-500" />
            <span>Posłowie</span>
          </Link>

          {/* Center Search - Floating? No, standard. */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex flex-col items-center gap-1 -mt-6"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Search size={24} />
            </div>
            <span className="text-xs font-medium text-primary mt-1">Szukaj</span>
          </button>

          <Link to="/dla-ciebie" className="flex flex-col items-center gap-1 text-xs font-medium text-secondary hover:text-primary p-2">
            <div className="relative">
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <span>Dla Ciebie</span>
          </Link>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center gap-1 text-xs font-medium text-secondary hover:text-primary p-2"
          >
            <Menu size={20} />
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
