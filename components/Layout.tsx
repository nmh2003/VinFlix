
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { Search, Film, History, Home, BookOpen, Gamepad2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './Button';
import { LiveSearch } from './LiveSearch';
import { MobileSearchOverlay } from './MobileSearchOverlay';
import { useStore } from '../hooks/useStore';

export const Layout: React.FC = () => {
  const { settings } = useStore(); // Use global settings
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Match routes
  const matchDetail = useMatch('/phim/:slug');
  const matchComicDetail = useMatch('/truyen/:slug');
  const matchReader = useMatch('/truyen/:slug/chap/:id');
  const matchGamePlay = useMatch('/game/:namespace');
  
  // Logic grouping
  const isDetailPage = !!matchDetail || !!matchComicDetail || !!matchGamePlay;
  const isReaderPage = !!matchReader; 

  // Auto Scroll To Top on Route Change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Apply Theme from Store
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // --- Contextual Search Logic (Desktop) ---
  const getSearchContext = () => {
    const path = location.pathname;
    if (path.startsWith('/truyen')) return 'comic';
    if (path.startsWith('/phim') || path.startsWith('/danh-sach') || path.startsWith('/the-loai') || path.startsWith('/quoc-gia') || path.startsWith('/nam')) {
        return 'movie';
    }
    return 'unified';
  };

  const searchContext = getSearchContext();

  const getPlaceholder = () => {
      if (searchContext === 'comic') return 'Tìm truyện...';
      if (searchContext === 'movie') return 'Tìm phim...';
      return 'Tìm phim, truyện...';
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const encoded = encodeURIComponent(searchQuery);
      
      if (searchContext === 'comic') {
           navigate(`/truyen-tranh/tim-kiem?keyword=${encoded}`);
      } else if (searchContext === 'movie') {
           navigate(`/tim-kiem?keyword=${encoded}&scope=movie`);
      } else {
           navigate(`/tim-kiem?keyword=${encoded}`);
      }
    }
  };

  const navLinks = [
    { name: 'Trang Chủ', path: '/' },
    { name: 'Phim Bộ', path: '/danh-sach/phim-bo' },
    { name: 'Phim Lẻ', path: '/danh-sach/phim-le' },
    { name: 'Chiếu Rạp', path: '/danh-sach/phim-chieu-rap' },
    { name: 'Sắp Chiếu', path: '/danh-sach/phim-sap-chieu' },
    { name: 'Truyện Tranh', path: '/truyen-tranh' },
    { name: 'Game Vui', path: '/games' }, 
  ];

  // Mobile Bottom Nav Items
  const mobileNavItems = [
    { name: 'Trang chủ', path: '/', icon: <Home size={20} /> },
    { name: 'Phim', path: '/danh-sach/phim-le', icon: <Film size={20} /> },
    { name: 'Truyện', path: '/truyen-tranh', icon: <BookOpen size={20} /> },
    { name: 'Game', path: '/games', icon: <Gamepad2 size={20} /> },
  ];
  
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 bg-gray-100 dark:bg-darker text-gray-900 dark:text-gray-200 font-sans">
      
      {/* ================= DESKTOP HEADER ================= */}
      {!isReaderPage && (
      <header className="hidden md:block sticky top-0 z-50 backdrop-blur-sm border-b transition-colors duration-300 bg-white/90 border-gray-200 dark:bg-black/90 dark:border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-2xl">
              <Film className="w-8 h-8" />
              <span>VinFlix</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={`text-sm font-medium hover:text-primary transition-colors ${location.pathname.startsWith(link.path) && link.path !== '/' ? 'text-primary' : ''}`}>
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Live Search */}
            <LiveSearch 
              placeholder={getPlaceholder()} 
              onSearch={handleSearch}
              className="w-40 lg:w-64" 
            />

            {/* SETTINGS LINK REPLACED THEME TOGGLE */}
            <Link to="/cai-dat" title="Cài đặt">
                <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
                    <SettingsIcon size={20} />
                </button>
            </Link>

            <Link to="/lich-su">
                <Button size="sm" variant="ghost" className="p-2" title="Lịch sử">
                    <History size={20} />
                </Button>
            </Link>
          </div>
        </div>
      </header>
      )}

      {/* ================= MOBILE TOP BAR ================= */}
      {!isReaderPage && (
      <div className="md:hidden sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 h-14 px-4 flex items-center justify-between shadow-sm">
          <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
              <Film className="w-6 h-6" />
              <span>VinFlix</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Trigger Full Screen Search Overlay */}
            <button 
                onClick={() => setIsMobileSearchOpen(true)}
                className="text-gray-500 hover:text-primary active:scale-95 transition-transform"
            >
                <Search size={20} />
            </button>
            
            <Link to="/lich-su">
                <History size={20} className="text-gray-500" />
            </Link>

            {/* SETTINGS LINK REPLACED THEME TOGGLE */}
            <Link to="/cai-dat">
                <button className="p-1 rounded-full active:bg-gray-200 dark:active:bg-gray-800 transition-colors text-gray-500">
                    <SettingsIcon size={20} />
                </button>
            </Link>
          </div>
      </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isDetailPage || isReaderPage ? 'mb-0' : 'container mx-auto px-2 md:px-4 py-4 md:py-6 mb-16 md:mb-0'}`}>
        <Outlet />
      </main>

      {/* ================= MOBILE STICKY BOTTOM FOOTER ================= */}
      {!isReaderPage && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => {
            const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
      )}

      {/* Desktop Footer */}
      {!isReaderPage && (
      <footer className="hidden md:block border-t transition-colors duration-300 bg-white border-gray-200 dark:bg-black dark:border-white/10 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p className="font-bold text-gray-900 dark:text-white text-lg mb-2">© 2026 VinFlix</p>
          <p>Phát Triển bởi Thích Tâm Phuk</p>
        </div>
      </footer>
      )}

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay 
          isOpen={isMobileSearchOpen} 
          onClose={() => setIsMobileSearchOpen(false)} 
      />
    </div>
  );
};
