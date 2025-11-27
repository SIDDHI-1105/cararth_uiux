import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Mic, Search, ChevronRight } from "lucide-react";
import { FullWidthLayout } from "@/components/layout";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedInput, setFocusedInput] = useState(false);

  useEffect(() => {
    // Detect current theme from document
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/results?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <FullWidthLayout showFooter={true}>
      {/* Hero Section - Maximum Negative Space */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
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
              color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.75)",
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
            style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.75)" }}
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
              <span>No Paid Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>Real-Time Listings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why CarArth Section - Clean Stats */}
      <section 
        style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
        className="py-20 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto">
          <h2 
            style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
            className="text-4xl font-bold mb-12 transition-colors duration-300"
          >
            Why CarArth?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              style={{ 
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
              }}
              className="p-8 rounded-2xl border transition-colors duration-300"
            >
              <div className="text-5xl font-bold text-[#0071E3] mb-4">5+</div>
              <h3 
                style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                className="text-xl font-semibold mb-2 transition-colors duration-300"
              >
                Platforms Searched
              </h3>
              <p style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}>
                Cars24, Spinny, OLX, CarWale, Facebook Marketplace - all in one search
              </p>
            </div>
            
            <div 
              style={{ 
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
              }}
              className="p-8 rounded-2xl border transition-colors duration-300"
            >
              <div className="text-5xl font-bold text-[#00F5A0] mb-4">AI</div>
              <h3 
                style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                className="text-xl font-semibold mb-2 transition-colors duration-300"
              >
                Verified Listings
              </h3>
              <p style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}>
                Advanced AI screens every listing to filter out scams and fake deals
              </p>
            </div>
            
            <div 
              style={{ 
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
              }}
              className="p-8 rounded-2xl border transition-colors duration-300"
            >
              <div className="text-5xl font-bold text-[#FF6B35] mb-4">₹0</div>
              <h3 
                style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                className="text-xl font-semibold mb-2 transition-colors duration-300"
              >
                No Hidden Fees
              </h3>
              <p style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}>
                100% free for buyers - no commissions, no premium listings
              </p>
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
                  style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "#1d1d1f" }}
                  className="text-sm transition-colors duration-300 font-medium"
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
            style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.75)" }}
            className="text-xl mb-8 max-w-2xl mx-auto transition-colors duration-300"
          >
            Search across multiple platforms. AI-verified listings. Real-time updates from India's top markets.
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Search Cars
          </button>
        </div>
      </section>

    </FullWidthLayout>
  );
}
