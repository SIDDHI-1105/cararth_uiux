// FILE: client/src/components/StickyHeader.tsx – Spinny-inspired sticky header

import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Search, MapPin, User, Sun, Moon, Mic } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

export function StickyHeader() {
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
      {/* Launch Status Banner */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] w-full backdrop-blur-[20px] transition-all duration-500"
        style={{
          background: 'linear-gradient(90deg, rgba(22, 163, 74, 0.95), rgba(0, 113, 227, 0.95))',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-center text-white py-3 px-4 text-sm font-bold tracking-wide">
          🚀 <span className="animate-pulse">Hyderabad Live</span> | <span>Delhi NCR Soon</span>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header
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
        <div className="max-w-[90rem] mx-auto w-full px-6 py-3">
          <div className="flex items-center justify-between gap-6">
            {/* Logo - Left */}
            <Link href="/" className="transition-transform duration-300 hover:scale-105 flex-shrink-0">
              <BrandWordmark variant="header" showTagline={false} />
            </Link>

            {/* Center - Search Bar + Location Selector */}
            <div className="flex-1 max-w-3xl">
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                {/* Location Selector */}
                <div className="relative" ref={cityDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 border-2 whitespace-nowrap ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                        : 'bg-gray-50 border-gray-200 text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="hidden md:inline">{selectedCity}</span>
                  </button>

                  {/* City Dropdown */}
                  {showCityDropdown && (
                    <div
                      className={`absolute top-full mt-2 left-0 rounded-2xl shadow-2xl border-2 backdrop-blur-2xl z-50 ${
                        isDark
                          ? 'bg-gray-900/95 border-white/10'
                          : 'bg-white/95 border-gray-200'
                      }`}
                      style={{ minWidth: '180px' }}
                    >
                      {cities.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedCity(city);
                            setShowCityDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors first:rounded-t-2xl last:rounded-b-2xl ${
                            selectedCity === city
                              ? isDark
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500 text-white'
                              : isDark
                              ? 'text-white hover:bg-white/10'
                              : 'text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Bar */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search cars by brand, model, or keyword..."
                    className={`w-full px-5 py-3 pl-12 pr-12 rounded-2xl font-medium text-sm transition-all duration-300 border-2 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:bg-white/10 focus:border-blue-500/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:bg-white focus:border-blue-500/50'
                    }`}
                  />
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />

                  {/* Mic Button */}
                  <button
                    type="button"
                    onClick={handleMicClick}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-300 ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : isDark
                        ? 'text-gray-400 hover:bg-white/10 hover:text-white'
                        : 'text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Button - Desktop Only */}
                <button
                  type="submit"
                  className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #0071E3 0%, #0077ED 100%)',
                    boxShadow: '0 0 30px rgba(0, 113, 227, 0.4), 0 8px 24px rgba(0, 113, 227, 0.2)'
                  }}
                >
                  Search
                </button>
              </form>
            </div>

            {/* Right - Navigation Links */}
            <div className="flex gap-2 items-center flex-shrink-0">
              {/* Buy Link */}
              <Link
                href="/"
                className={`relative px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                  location === '/' || location === '/results'
                    ? 'text-white'
                    : isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  background: location === '/' || location === '/results'
                    ? 'linear-gradient(135deg, #0071E3 0%, #0077ED 100%)'
                    : 'transparent',
                  boxShadow: location === '/' || location === '/results'
                    ? '0 0 20px rgba(0, 113, 227, 0.3)'
                    : 'none'
                }}
              >
                <span className="hidden lg:inline">Buy</span>
                <span className="lg:hidden">🚗</span>
              </Link>

              {/* Sell Link */}
              <Link
                href="/sell"
                className={`relative px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                  location === '/sell' || location === '/sell-car'
                    ? 'text-white'
                    : isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  background: location === '/sell' || location === '/sell-car'
                    ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
                    : 'transparent',
                  boxShadow: location === '/sell' || location === '/sell-car'
                    ? '0 0 20px rgba(22, 163, 74, 0.3)'
                    : 'none'
                }}
              >
                <span className="hidden lg:inline">Sell</span>
                <span className="lg:hidden">💰</span>
              </Link>

              {/* Throttle Talk Link */}
              <Link
                href="/throttle-talk"
                className={`relative px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 ${
                  location === '/throttle-talk' || location.startsWith('/news')
                    ? 'text-white'
                    : isDark ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  background: location === '/throttle-talk' || location.startsWith('/news')
                    ? 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
                    : 'transparent',
                  boxShadow: location === '/throttle-talk' || location.startsWith('/news')
                    ? '0 0 20px rgba(59, 130, 246, 0.3)'
                    : 'none'
                }}
              >
                <span className="hidden lg:inline">Throttle Talk</span>
                <span className="lg:hidden">📰</span>
              </Link>

              {/* Sign In / Profile */}
              <Link
                href="/login"
                className={`relative p-2.5 rounded-2xl transition-all duration-300 hover:scale-110 ${
                  isDark
                    ? 'bg-white/5 text-white hover:bg-white/10'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`relative p-2.5 rounded-2xl transition-all duration-300 hover:scale-110 ${
                  isDark
                    ? 'bg-white/5 text-white hover:bg-white/10'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 transition-transform duration-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from going under sticky header */}
      <div style={{ height: '110px' }} />
    </>
  );
}
