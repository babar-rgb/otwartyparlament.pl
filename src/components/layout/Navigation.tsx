import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchOverlay from '../ui/SearchOverlay';

import ThemeToggle from '../ui/ThemeToggle';
// TermSwitcher removed

export default function Navigation() {
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
      <nav
        className={`fixed top-0 w-full z-50 py-6 transition-all duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${lastScrollY > 50
            ? 'bg-page/80 backdrop-blur-xl shadow-2xl py-4 border-b border-border-base'
            : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <Link to="/" className="font-extrabold text-2xl text-primary tracking-tight flex items-center gap-2">
              <span>otwartyparlament.pl</span>
            </Link>

            {/* Center: Main Links (Desktop) */}
            {/* Center: Main Links (Desktop) */}
            {/* Center: Main Links (Desktop) */}
            {/* Center: Main Links (Desktop) */}
            <div className="hidden xl:flex items-center gap-6 2xl:gap-8">
              <Link to="/poslowie" className="text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200">
                Posłowie
              </Link>
              <Link to="/komisje" className="text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200">
                Komisje
              </Link>
              <Link to="/glosowania" className="text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200">
                Głosowania
              </Link>
              <Link to="/rankingi" className="text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200">
                Rankingi
              </Link>
              <Link to="/projekty" className="text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200">
                Projekty
              </Link>

              <Link to="/o-projekcie" className="text-sm font-bold text-secondary hover:text-primary transition-colors hover:scale-105 transform duration-200">
                O Projekcie
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">

              <div className="hidden md:block">
                {/* TermSwitcher removed to avoid crowding */}
              </div>

              <ThemeToggle />

              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-primary hover:text-accent-blue transition-colors"
                aria-label="Szukaj"
              >
                <Search size={22} strokeWidth={2} />
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-primary hover:text-accent-blue transition-colors"
                aria-label="Menu"
              >
                {isSidebarOpen ? <X size={26} strokeWidth={2} /> : <Menu size={26} strokeWidth={2} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
