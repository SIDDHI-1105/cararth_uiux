// Compact Spinny-inspired header component
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Search, MapPin, User, Sun, Moon, Mic } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

export function CompactHeader() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [isListening, setIsListening] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const cities = ["Hyderabad", "Delhi", "Mumbai", "Bangalore", "Pune", "Chennai", "Kolkata", "Ahmedabad"];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close city dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/results?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity)}`;
    }
  };

  const handleMicClick = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Voice search unavailable",
        description: "Use Chrome, Edge, or Safari for voice search.",
        variant: "destructive"
      });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);

      toast({
        title: "Got it!",
        description: `"${transcript}"`,
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      let errorMessage = "Voice input failed";
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        errorMessage = "Microphone access denied. Enable it in browser settings.";
      } else if (event.error === 'no-speech') {
        errorMessage = "No speech detected. Try again.";
      } else if (event.error === 'network') {
        errorMessage = "Network error. Check your connection.";
      }

      toast({
        title: "Voice search failed",
        description: errorMessage,
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setIsListening(false);
    }
  };

  return (
    <>
      {/* Compact Spinny-style Header */}
      <header
        className="cararth-header"
        role="banner"
        style={{
          backgroundColor: isDark
            ? scrolled ? 'rgba(10, 10, 10, 0.95)' : 'rgba(10, 10, 10, 0.90)'
            : scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.06)',
          boxShadow: scrolled
            ? '0 6px 24px rgba(0, 0, 0, 0.12)'
            : '0 2px 12px rgba(0, 0, 0, 0.06)',
        }}
      >
        <div className="cararth-header__inner">
          {/* Left - Logo */}
          <div className="cararth-header__left">
            <Link href="/" className="logo-link">
              <BrandWordmark variant="header" showTagline={false} />
            </Link>
          </div>

          {/* Center - City + Search */}
          <div className="cararth-header__center" role="search" aria-label="Site search">
            {/* City Selector */}
            <div className="relative" ref={cityDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="city-pill"
                aria-label="Select city"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f6f7fb',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                  color: isDark ? '#fff' : '#111'
                }}
              >
                <MapPin className="city-icon" />
                <span className="hidden sm:inline">{selectedCity}</span>
                <span className="chev">▾</span>
              </button>

              {/* City Dropdown */}
              {showCityDropdown && (
                <div
                  className="absolute top-full mt-2 left-0 rounded-xl shadow-2xl border z-50 min-w-[180px]"
                  style={{
                    background: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setShowCityDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors first:rounded-t-xl last:rounded-b-xl"
                      style={{
                        background: selectedCity === city
                          ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                          : 'transparent',
                        color: isDark ? '#fff' : '#111'
                      }}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="search-wrapper" style={{
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f6f7fb',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)'
            }}>
              <Search className="search-icon" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)' }} />
              <input
                id="header-search"
                data-header-search
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cars by brand, model, or keyword..."
                className="search-input"
                aria-label="Search cars"
                style={{
                  color: isDark ? '#fff' : '#111'
                }}
              />
              <button
                type="button"
                onClick={handleMicClick}
                className="mic-btn"
                aria-label="Voice search"
                style={{
                  background: isListening ? '#ef4444' : 'transparent',
                  color: isListening ? '#fff' : isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'
                }}
              >
                <Mic className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right - Actions */}
          <div className="cararth-header__right" role="navigation" aria-label="Top actions">
            {/* Search Button (Desktop) */}
            <button
              type="submit"
              onClick={() => handleSearch()}
              className="ghost-btn search-cta hidden md:flex"
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
                color: isDark ? '#fff' : '#111'
              }}
            >
              Search
            </button>

            {/* Buy */}
            <Link
              href="/"
              className={`primary-pill ${location === '/' || location === '/results' ? 'active' : ''}`}
            >
              Buy
            </Link>

            {/* Sell */}
            <Link
              href="/sell"
              className={`link-btn hidden lg:inline-flex ${location === '/sell' ? 'active' : ''}`}
              style={{ color: isDark ? '#fff' : '#111' }}
            >
              Sell
            </Link>

            {/* Throttle Talk */}
            <Link
              href="/throttle-talk"
              className={`link-btn hidden xl:inline-flex ${location === '/throttle-talk' || location.startsWith('/news') ? 'active' : ''}`}
              style={{ color: isDark ? '#fff' : '#111' }}
            >
              Throttle Talk
            </Link>

            {/* Account */}
            <Link
              href="/login"
              className="icon-btn"
              aria-label="Account"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
                color: isDark ? '#fff' : '#111'
              }}
            >
              <User className="w-4 h-4" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="icon-btn"
              aria-label="Toggle theme"
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f3f4f6',
                color: isDark ? '#fff' : '#111'
              }}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under header */}
      <div style={{ height: '95px' }} />
    </>
  );
}
