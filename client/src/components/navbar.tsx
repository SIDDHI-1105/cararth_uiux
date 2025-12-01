// FILE: client/src/components/navbar.tsx – Luxury Glassmorphic redesign applied

import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Sun, Moon } from "lucide-react";

export default function Navbar() {
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Detect scroll for fade-in effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      {/* Launch Status Banner - Premium Glass with Gradient */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] w-full backdrop-blur-[20px] transition-all duration-500"
        style={{
          background: 'linear-gradient(90deg, rgba(22, 163, 74, 0.95), rgba(0, 113, 227, 0.95))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-center text-white py-3 px-4 text-sm font-bold tracking-wide">
          🚀 <span className="animate-pulse">Hyderabad – Live Now!</span> | <span>Delhi NCR – Coming Soon</span>
        </div>
      </div>

      {/* Main Navigation - Ultra-Thin Frosted Glass */}
      <nav
        className="fixed top-[46px] left-0 right-0 z-[9998] w-full backdrop-blur-[40px] border-b transition-all duration-500"
        style={{
          backgroundColor: isDark
            ? scrolled ? 'rgba(10, 10, 10, 0.85)' : 'rgba(10, 10, 10, 0.75)'
            : scrolled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
          boxShadow: scrolled
            ? '0 8px 32px rgba(0, 0, 0, 0.15)'
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="max-w-[90rem] mx-auto w-full flex justify-between items-center px-8 h-18">
          {/* Logo with Hover Scale */}
          <Link href="/" data-testid="link-home" className="transition-transform duration-300 hover:scale-105">
            <BrandWordmark variant="header" showTagline={false} />
          </Link>

          {/* Navigation Links - Premium Glass Pills */}
          <div className="flex gap-3 items-center">
            {/* Buy Link */}
            <Link
              href="/"
              data-testid="link-buy-cars"
              className={`relative px-6 py-3 rounded-2xl font-bold text-[15px] transition-all duration-500 group overflow-hidden ${
                location === '/' || location === '/results'
                  ? 'text-white'
                  : `${isDark ? 'text-white hover:scale-105' : 'text-[#1d1d1f] hover:scale-105'}`
              }`}
              style={{
                background: location === '/' || location === '/results'
                  ? 'linear-gradient(135deg, #0071E3 0%, #0077ED 100%)'
                  : 'transparent',
                boxShadow: location === '/' || location === '/results'
                  ? '0 0 30px rgba(0, 113, 227, 0.4), 0 8px 24px rgba(0, 113, 227, 0.2)'
                  : 'none'
              }}
            >
              {!(location === '/' || location === '/results') && (
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 -z-10`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                  }}
                />
              )}
              <span className="relative z-10">Buy</span>
            </Link>

            {/* Sell Link */}
            <Link
              href="/sell-car"
              data-testid="link-sell-car"
              className={`relative px-6 py-3 rounded-2xl font-bold text-[15px] transition-all duration-500 group overflow-hidden ${
                location === '/sell-car' || location === '/sell'
                  ? 'text-white'
                  : `${isDark ? 'text-white hover:scale-105' : 'text-[#1d1d1f] hover:scale-105'}`
              }`}
              style={{
                background: location === '/sell-car' || location === '/sell'
                  ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                  : 'transparent',
                boxShadow: location === '/sell-car' || location === '/sell'
                  ? '0 0 30px rgba(22, 163, 74, 0.4), 0 8px 24px rgba(22, 163, 74, 0.2)'
                  : 'none'
              }}
            >
              {!(location === '/sell-car' || location === '/sell') && (
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 -z-10`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                  }}
                />
              )}
              <span className="relative z-10">💰 Sell</span>
            </Link>

            {/* Throttle Talk Link */}
            <Link
              href="/news"
              data-testid="link-throttle-talk"
              className={`relative px-6 py-3 rounded-2xl font-bold text-[15px] transition-all duration-500 group overflow-hidden ${
                location === '/news'
                  ? 'text-white'
                  : `${isDark ? 'text-white hover:scale-105' : 'text-[#1d1d1f] hover:scale-105'}`
              }`}
              style={{
                background: location === '/news'
                  ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
                  : 'transparent',
                boxShadow: location === '/news'
                  ? '0 0 30px rgba(59, 130, 246, 0.4), 0 8px 24px rgba(59, 130, 246, 0.2)'
                  : 'none'
              }}
            >
              {location !== '/news' && (
                <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 -z-10`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
                  }}
                />
              )}
              <span className="relative z-10">🚗 Throttle Talk</span>
            </Link>

            {/* Theme Toggle - Premium Glass Button */}
            <button
              onClick={toggleTheme}
              className={`relative p-3 rounded-2xl transition-all duration-500 hover:scale-110 group overflow-hidden`}
              style={{
                color: isDark ? '#ffffff' : '#1d1d1f',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
              }}
              aria-label="Toggle theme"
              data-testid="button-theme-toggle"
            >
              <div
                className={`absolute inset-0 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100 -z-10`}
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255, 200, 87, 0.2), rgba(251, 191, 36, 0.2))'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15))',
                  boxShadow: isDark
                    ? '0 0 20px rgba(251, 191, 36, 0.3)'
                    : '0 0 20px rgba(59, 130, 246, 0.2)'
                }}
              />
              {isDark ? (
                <Sun className="w-5 h-5 relative z-10 transition-transform duration-500 group-hover:rotate-180" />
              ) : (
                <Moon className="w-5 h-5 relative z-10 transition-transform duration-500 group-hover:-rotate-12" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
