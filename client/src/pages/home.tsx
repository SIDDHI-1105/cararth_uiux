import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Search, ChevronRight } from "lucide-react";
import { BrandWordmark } from "@/components/brand-wordmark";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedInput, setFocusedInput] = useState(false);

  useEffect(() => {
    // Auto-detect system theme
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(prefersDark);
    
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Redirect to search results
      window.location.href = `/results?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  return (
    <div 
      style={{
        backgroundColor: isDark ? "#000000" : "#fbfbfb",
        color: isDark ? "#f5f5f7" : "#1d1d1f",
      }}
      className="min-h-screen overflow-x-hidden transition-colors duration-300"
    >
      {/* Header */}
      <header 
        style={{
          backgroundColor: isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.8)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <BrandWordmark variant="header" showTagline={false} />
          <button
            onClick={toggleTheme}
            style={{
              color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
            }}
            className="px-4 py-2 text-sm font-semibold hover:opacity-100 transition-opacity duration-300"
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* Hero Section - Maximum Negative Space */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Headline - Huge, Minimal */}
          <h1 
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f",
            }}
            className="text-7xl sm:text-8xl lg:text-9xl font-900 tracking-tighter leading-none mb-8 animate-fade-in transition-colors duration-300"
          >
            Find Your Perfect
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071E3] to-[#0077ED]">
              Car
            </span>
          </h1>

          {/* Subheading - Clean, Minimal */}
          <p 
            style={{
              color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)",
            }}
            className="text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed animate-fade-in transition-colors duration-300"
          >
            Search across Cars24, Spinny, OLX, CarWale, and Facebook Marketplace. AI-powered verification helps you find authentic deals faster.
          </p>

          {/* Search Bar - Glassmorphic, Massive, Centered */}
          <div
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
              borderColor: isDark 
                ? focusedInput ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)"
                : focusedInput ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.1)",
              boxShadow: focusedInput 
                ? "0 0 20px rgba(0, 113, 227, 0.4)"
                : "none",
            }}
            className="backdrop-blur-[12px] rounded-full border transition-all duration-300 flex items-center gap-3 px-6 py-4 mb-8 animate-slide-up"
          >
            <Search 
              style={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)" }}
              className="w-5 h-5"
            />
            <input
              type="text"
              placeholder="Swift under 5 lakh in Pune..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                backgroundColor: "transparent",
                color: isDark ? "#f5f5f7" : "#1d1d1f",
              }}
              className="flex-1 text-lg outline-none transition-colors duration-300"
              placeholderStyle={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)" }}
            />
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Mic 
                style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                className="w-5 h-5"
              />
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#0071E3] hover:bg-[#0077ED] rounded-full font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Search
            </button>
          </div>

          {/* Quick Stats - Minimal Pills */}
          <div 
            style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
            className="flex flex-wrap gap-3 text-sm transition-colors duration-300"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>Multi-Platform Search</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>AI Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>Real-Time Listings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Car Section - One Large Hero Car */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Featured Listing</h2>

          {/* Glass Card with Hero Car */}
          <div className="glass-card group cursor-pointer">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 rounded-lg overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚗</div>
                    <p>Car Image</p>
                  </div>
                </div>
              </div>

              {/* Details - Minimal, Huge Typography */}
              <div className="flex flex-col justify-center">
                <div className="mb-6">
                  <div className="inline-block trust-pill mb-4">
                    ✓ From OLX India
                  </div>
                  <h3 className="text-5xl font-bold mb-2">Hyundai Creta</h3>
                  <p 
                    style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                    className="transition-colors duration-300"
                  >
                    2022 • 45,000 km • Hyderabad
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <p 
                      style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                      className="text-sm mb-1 transition-colors duration-300"
                    >
                      Price
                    </p>
                    <p 
                      style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                      className="text-4xl font-bold transition-colors duration-300"
                    >
                      ₹8,50,000
                    </p>
                  </div>
                  <div 
                    style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
                    className="grid grid-cols-2 gap-4 pt-4 border-t transition-colors duration-300"
                  >
                    <div>
                      <p 
                        style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                        className="text-sm mb-1 transition-colors duration-300"
                      >
                        Engine
                      </p>
                      <p 
                        style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                        className="font-semibold transition-colors duration-300"
                      >
                        1.5L Petrol
                      </p>
                    </div>
                    <div>
                      <p 
                        style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                        className="text-sm mb-1 transition-colors duration-300"
                      >
                        Transmission
                      </p>
                      <p 
                        style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                        className="font-semibold transition-colors duration-300"
                      >
                        Automatic
                      </p>
                    </div>
                  </div>
                </div>

                <button className="btn-primary w-full group/btn">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12">Why CarArth</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Stat Cards */}
            {[
              {
                number: "5+",
                title: "Platform Aggregation",
                description: "Search OLX, Cars24, Spinny, CarWale, Facebook",
              },
              {
                number: "AI",
                title: "Powered Search",
                description: "Multi-LLM verification for authenticity",
              },
              {
                number: "HYD",
                title: "Hyderabad Focus",
                description: "Deep local market intelligence",
              },
            ].map((stat, idx) => (
              <div key={idx} className="glass-card">
                <p className="text-4xl font-bold text-[#0071E3] mb-2">
                  {stat.number}
                </p>
                <h4 className="text-lg font-semibold mb-2">{stat.title}</h4>
                <p 
                  style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                  className="text-sm transition-colors duration-300"
                >
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        style={{ 
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        }}
        className="py-20 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
            className="text-5xl font-bold mb-6 transition-colors duration-300"
          >
            Ready to find your car?
          </h2>
          <p 
            style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
            className="text-xl mb-8 max-w-2xl mx-auto transition-colors duration-300"
          >
            Search across multiple platforms. AI-verified listings. Real-time updates from India's top markets.
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Search Cars
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 lg:px-8 text-center text-white/60 text-sm">
        <p>
          © 2025 CarArth. India's used car search engine.{" "}
          <a href="#" className="text-[#0071E3] hover:text-[#0077ED]">
            Learn more
          </a>
        </p>
      </footer>
    </div>
  );
}
