import { Link } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchOverlay from './SearchOverlay';

import ThemeToggle from './ThemeToggle';

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
        className={`fixed top-0 w-full z-50 py-6 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${lastScrollY > 50 ? 'bg-paper/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm py-4' : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <Link to="/" className="font-extrabold text-2xl text-ink dark:text-white tracking-tight flex items-center gap-2">
              <span>otwartyparlament.pl</span>
            </Link>

            {/* Center: Main Links (Desktop) */}
            <div className="hidden xl:flex items-center gap-6">
              <Link to="/poslowie" className="text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Posłowie
              </Link>
              <Link to="/europarlament" className="text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Europarlament
              </Link>
              <Link to="/glosowania" className="text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Głosowania
              </Link>
              <Link to="/rankingi" className="text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Rankingi
              </Link>
              <Link to="/projekty" className="text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Projekty
              </Link>
              <Link to="/o-projekcie" className="text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                O Projekcie
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">

              <ThemeToggle />

              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-ink dark:text-white hover:opacity-70 transition-opacity"
                aria-label="Szukaj"
              >
                <Search size={24} strokeWidth={2} />
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-ink dark:text-white hover:opacity-70 transition-opacity"
                aria-label="Menu"
              >
                {isSidebarOpen ? <X size={28} strokeWidth={2} /> : <Menu size={28} strokeWidth={2} />}
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
