import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function Navigation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    { label: 'Posłowie', href: '/poslowie' },
    { label: 'Głosowania', href: '/glosowania' },
    { label: 'Ranking', href: '/rankingi' },
    { label: 'Test wyborczy', href: '/test' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 py-6 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          } ${lastScrollY > 50 ? 'bg-white/90 backdrop-blur-sm shadow-sm py-4' : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-center">
            {/* Left: Logo */}
            <Link to="/" className="font-extrabold text-2xl text-black tracking-tight">
              otwartyparlament.pl
            </Link>

            {/* Center: Main Links (Desktop) */}
            <div className="hidden md:flex items-center gap-12">
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium uppercase tracking-wide text-black hover:opacity-70 transition-opacity ${location.pathname === link.href ? 'opacity-100' : 'opacity-80'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right: Hamburger Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-black hover:opacity-70 transition-opacity"
              aria-label="Menu"
            >
              {isSidebarOpen ? <X size={28} strokeWidth={2} /> : <Menu size={28} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </>
  );
}
