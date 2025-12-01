import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Sun, Moon } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <>
      {/* Launch Status Banner - Glassmorphic */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] w-full backdrop-blur-md"
        style={{
          background: 'linear-gradient(90deg, rgba(22, 163, 74, 0.9), rgba(0, 113, 227, 0.9))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="text-center text-white py-2.5 px-4 text-sm font-semibold">
          🚀 <strong>Hyderabad – Live Now!</strong> | <strong>Delhi NCR – Coming Soon</strong>
        </div>
      </div>

      {/* Main Navigation - Glassmorphic */}
      <nav
        className="fixed top-[42px] left-0 right-0 z-[9998] w-full backdrop-blur-[12px] border-b transition-all duration-300"
        style={{
          backgroundColor: isDark ? 'rgba(26, 26, 26, 0.72)' : 'rgba(255, 255, 255, 0.72)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div className="max-w-[80rem] mx-auto w-full flex justify-between items-center px-4 h-16">
          <Link href="/" data-testid="link-home">
            <BrandWordmark variant="header" showTagline={false} />
          </Link>

          <div className="flex gap-2 items-center">
            <Link
              href="/"
              data-testid="link-buy-cars"
              className={`px-4 py-2 rounded-xl font-semibold text-[15px] transition-all duration-300 ${
                location === '/' || location === '/results'
                  ? 'bg-[#0071E3] text-white shadow-lg shadow-blue-500/30'
                  : `${isDark ? 'text-white hover:bg-white/10' : 'text-[#1d1d1f] hover:bg-black/5'}`
              }`}
            >
              Buy
            </Link>
            <Link
              href="/sell-car"
              data-testid="link-sell-car"
              className={`px-4 py-2 rounded-xl font-semibold text-[15px] transition-all duration-300 ${
                location === '/sell-car' || location === '/sell'
                  ? 'bg-[#16a34a] text-white shadow-lg shadow-green-500/30'
                  : `${isDark ? 'text-white hover:bg-white/10' : 'text-[#1d1d1f] hover:bg-black/5'}`
              }`}
            >
              💰 Sell
            </Link>
            <Link
              href="/news"
              data-testid="link-throttle-talk"
              className={`px-4 py-2 rounded-xl font-semibold text-[15px] transition-all duration-300 ${
                location === '/news'
                  ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-400/30'
                  : `${isDark ? 'text-white hover:bg-white/10' : 'text-[#1d1d1f] hover:bg-black/5'}`
              }`}
            >
              🚗 Throttle Talk
            </Link>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-300 ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
              }`}
              style={{ color: isDark ? '#ffffff' : '#1d1d1f' }}
              aria-label="Toggle theme"
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
