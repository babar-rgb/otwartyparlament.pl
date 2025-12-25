import { Link } from 'react-router-dom';
import { Menu, X, Search, Users, Briefcase, CheckSquare, BarChart3, FileText, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchOverlay from './SearchOverlay';

import ThemeToggle from './ThemeToggle';
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
            ? 'bg-page/95 backdrop-blur-md shadow-2xl py-4 border-b border-border-base'
            : 'bg-transparent'
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
              <Link to="/poslowie" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <Users size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                Posłowie
              </Link>
              <Link to="/komisje" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <Briefcase size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                Komisje
              </Link>
              <Link to="/glosowania" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <CheckSquare size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                Głosowania
              </Link>
              <Link to="/rankingi" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <BarChart3 size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                Rankingi
              </Link>
              <Link to="/projekty" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <FileText size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                Projekty
              </Link>
              <Link to="/o-projekcie" className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                <Heart size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
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
