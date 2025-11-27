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

  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: 'linear-gradient(90deg, #16a34a, #0071E3)',
    color: 'white',
    padding: '10px 16px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 600,
    width: '100%',
    boxSizing: 'border-box',
  };

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: '42px',
    left: 0,
    right: 0,
    zIndex: 9998,
    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
    color: isDark ? '#ffffff' : '#1d1d1f',
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    width: '100%',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '80rem',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
  };

  const linkStyle = (isActive: boolean, color?: string): React.CSSProperties => ({
    padding: '8px 16px',
    cursor: 'pointer',
    color: isActive ? '#ffffff' : (isDark ? '#ffffff' : '#1d1d1f'),
    backgroundColor: isActive ? (color || '#0071E3') : 'transparent',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '15px',
    textDecoration: 'none',
    display: 'inline-block',
  });

  const themeButtonStyle: React.CSSProperties = {
    padding: '8px',
    cursor: 'pointer',
    color: isDark ? '#ffffff' : '#1d1d1f',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <>
      {/* Launch Status Banner */}
      <div style={bannerStyle}>
        🚀 <strong>Hyderabad – Live Now!</strong> | <strong>Delhi NCR – Coming Soon</strong>
      </div>
      
      {/* Main Navigation */}
      <nav style={navStyle}>
        <div style={containerStyle}>
          <Link href="/" data-testid="link-home">
            <BrandWordmark variant="header" showTagline={false} />
          </Link>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Link href="/" style={linkStyle(location === '/' || location === '/results')} data-testid="link-buy-cars">
              Buy
            </Link>
            <Link href="/sell-car" style={linkStyle(location === '/sell-car' || location === '/sell', '#16a34a')} data-testid="link-sell-car">
              💰 Sell
            </Link>
            <Link href="/news" style={linkStyle(location === '/news', '#3b82f6')} data-testid="link-throttle-talk">
              🚗 Throttle Talk
            </Link>
            <button 
              onClick={toggleTheme} 
              style={themeButtonStyle}
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
