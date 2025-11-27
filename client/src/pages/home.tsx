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

  return (
    <div className="min-h-screen bg-black dark:bg-black text-white dark:text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <BrandWordmark variant="header" showTagline={false} />
          <button
            onClick={() => setIsDark(!isDark)}
            className="px-4 py-2 text-sm font-500 text-white/60 hover:text-white transition-colors"
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {/* Hero Section - Maximum Negative Space */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Headline - Huge, Minimal */}
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-900 tracking-tighter leading-none mb-8 animate-fade-in">
            Find Your Perfect
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071E3] to-[#0077ED]">
              Car
            </span>
          </h1>

          {/* Subheading - Clean, Minimal */}
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mb-12 leading-relaxed animate-fade-in">
            Search 50,000+ verified used cars across India. Compare prices, authenticity, and value in seconds.
          </p>

          {/* Search Bar - Glassmorphic, Massive, Centered */}
          <div
            className={`
              backdrop-blur-[12px] rounded-full border transition-all duration-300
              ${
                focusedInput
                  ? "bg-white/12 border-white/20 shadow-lg"
                  : "bg-white/8 border-white/10"
              }
              flex items-center gap-3 px-6 py-4 mb-8 animate-slide-up
            `}
          >
            <Search className="w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Swift under 5 lakh in Pune..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-transparent text-white text-lg outline-none placeholder-white/40"
            />
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Mic className="w-5 h-5 text-white/60 hover:text-white/80" />
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#0071E3] hover:bg-[#0077ED] rounded-full font-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
            >
              Search
            </button>
          </div>

          {/* Quick Stats - Minimal Pills */}
          <div className="flex flex-wrap gap-3 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>50,000+ Verified Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>AI-Powered Authenticity Checks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>Zero Hidden Charges</span>
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
                    ✓ AI Verified
                  </div>
                  <h3 className="text-5xl font-bold mb-2">Hyundai Creta</h3>
                  <p className="text-white/60">2022 • 45,000 km • Pune</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Price</p>
                    <p className="text-4xl font-bold">₹8,50,000</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Engine</p>
                      <p className="font-500">1.5L Petrol</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm mb-1">Transmission</p>
                      <p className="font-500">Automatic</p>
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
                number: "50K+",
                title: "Verified Cars",
                description: "Across all major platforms in India",
              },
              {
                number: "3.2M",
                title: "Smart Searches",
                description: "Processed monthly with AI",
              },
              {
                number: "99.8%",
                title: "Authenticity Rate",
                description: "Multi-LLM verification system",
              },
            ].map((stat, idx) => (
              <div key={idx} className="glass-card">
                <p className="text-4xl font-bold text-[#0071E3] mb-2">
                  {stat.number}
                </p>
                <h4 className="text-lg font-600 mb-2">{stat.title}</h4>
                <p className="text-white/60 text-sm">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to find your car?
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-2xl mx-auto">
            Start searching across 50,000+ verified listings from Cars24, Spinny, OLX, and more.
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
