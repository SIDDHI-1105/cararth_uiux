// FILE: client/src/components/navbar-improved.tsx – Dark/light mode fixed

import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function NavbarImproved() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  //  Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
    backdropFilter: 'blur(10px)',
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
    transition: 'all 0.2s ease',
  });

  const mobileLinkStyle = (isActive: boolean, color?: string): React.CSSProperties => ({
    padding: '12px 20px',
    cursor: 'pointer',
    color: isActive ? '#ffffff' : (isDark ? '#ffffff' : '#1d1d1f'),
    backgroundColor: isActive ? (color || '#0071E3') : 'transparent',
    borderRadius: '12px',
    fontWeight: 600,
    fontSize: '17px',
    textDecoration: 'none',
    display: 'block',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
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
    transition: 'all 0.2s ease',
  };

  const mobileMenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: '106px', // banner (42px) + nav (64px)
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDark ? 'rgba(26, 26, 26, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(20px)',
    zIndex: 9997,
    padding: '24px',
    overflowY: 'auto',
    transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.3s ease',
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

          {/* Desktop Navigation - Hidden on Mobile */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} className="hidden md:flex">
            <Link href="/" style={linkStyle(location === '/' || location === '/results')} data-testid="link-buy-cars">
              Buy
            </Link>
            <Link href="/sell" style={linkStyle(location === '/sell-car' || location === '/sell', '#16a34a')} data-testid="link-sell-car">
              💰 Sell
            </Link>
            <Link href="/news" style={linkStyle(location === '/news', '#3b82f6')} data-testid="link-throttle-talk">
              🚗 Throttle Talk
            </Link>
            <button
              onClick={toggleTheme}
              style={themeButtonStyle}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Mobile Navigation Toggle - Visible on Mobile Only */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              style={themeButtonStyle}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              data-testid="button-theme-toggle-mobile"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={themeButtonStyle}
              aria-label="Toggle menu"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div style={mobileMenuStyle} className="md:hidden">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/"
            style={mobileLinkStyle(location === '/' || location === '/results')}
            data-testid="mobile-link-buy-cars"
          >
            🛍️ Buy Cars
          </Link>
          <Link
            href="/sell"
            style={mobileLinkStyle(location === '/sell-car' || location === '/sell', '#16a34a')}
            data-testid="mobile-link-sell-car"
          >
            💰 Sell Your Car
          </Link>
          <Link
            href="/news"
            style={mobileLinkStyle(location === '/news', '#3b82f6')}
            data-testid="mobile-link-throttle-talk"
          >
            🚗 Throttle Talk
          </Link>

          {/* Additional Mobile Links */}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Quick Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                href="/faq"
                style={{ ...mobileLinkStyle(location === '/faq'), fontSize: '15px', padding: '8px 12px' }}
              >
                FAQ
              </Link>
              <Link
                href="/privacy-policy"
                style={{ ...mobileLinkStyle(location === '/privacy-policy'), fontSize: '15px', padding: '8px 12px' }}
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                style={{ ...mobileLinkStyle(location === '/terms'), fontSize: '15px', padding: '8px 12px' }}
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
