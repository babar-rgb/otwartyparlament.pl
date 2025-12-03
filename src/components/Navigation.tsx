import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SearchOverlay from './SearchOverlay';

export default function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

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

  const links = [
    { label: 'Strona główna', href: '/' },
    { href: '/poslowie', label: 'Posłowie' },
    { href: '/glosowania', label: 'Głosowania' },
    { href: '/rankingi', label: 'Rankingi' },
    { href: '/projekty', label: 'Projekty' },
    { href: '/o-projekcie', label: 'O projekcie' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 py-6 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${lastScrollY > 50 ? 'bg-paper/95 backdrop-blur-sm shadow-sm py-4' : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <Link to="/" className="font-extrabold text-2xl text-ink tracking-tight">
              otwartyparlament.pl
            </Link>

            {/* Center: Main Links (Desktop) */}
            <div className="hidden md:flex items-center gap-12">
              <Link to="/poslowie" className="text-sm font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                Posłowie
              </Link>
              <Link to="/glosowania" className="text-sm font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                Głosowania
              </Link>
              <Link to="/rankingi" className="text-sm font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                Rankingi
              </Link>
              <Link to="/projekty" className="text-sm font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                Projekty
              </Link>
              <Link to="/o-projekcie" className="text-sm font-bold text-neutral-900 hover:text-blue-600 transition-colors">
                O Projekcie
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-ink hover:opacity-70 transition-opacity"
                aria-label="Szukaj"
              >
                <Search size={24} strokeWidth={2} />
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-ink hover:opacity-70 transition-opacity"
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
