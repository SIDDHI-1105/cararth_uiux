// FILE: client/src/pages/home.tsx – Updated to include all homepage sections (fixed)
import { useState, useEffect, useCallback } from "react";
import { Sparkles, Zap, Shield } from "lucide-react";
import { FullWidthLayout } from "@/components/layout";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Home page — full content (Hero, Metrics, Testimonials, Popular Models, Budgets, How It Works, FAQ, CTA)
 * Preserves:
 *  - useTheme / isDark logic
 *  - scrollToSearchBar helper (exposed on window)
 *  - search form state & handleSearch
 *
 * Note: This file is intentionally self-contained; small presentational helper components are defined inline.
 */

type TabType = "buy" | "sell";

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Scroll-to-search helper (used by CTA)
  const scrollToSearchBar = useCallback(() => {
    const target =
      document.querySelector("#header-search, [data-header-search], input[placeholder*='Search cars']");

    if (!target) {
      console.warn("[scrollToSearchBar] search element not found");
      return;
    }

    try {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        if (target instanceof HTMLInputElement) target.focus();
      }, 500);
    } catch (err) {
      const rect = target.getBoundingClientRect();
      window.scrollTo({
        top: rect.top + window.scrollY - 80,
        behavior: "smooth",
      });
    }
  }, []);

  // Global fallback for legacy scripts:
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).scrollToSearchBar) {
      (window as any).scrollToSearchBar = () => {
        const el = document.querySelector("#header-search, [data-header-search]");
        if (el) {
          (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
          if (el instanceof HTMLInputElement) setTimeout(() => el.focus(), 500);
        }
      };
    }
    return () => {
      if (typeof window !== "undefined" && (window as any).scrollToSearchBar) {
        delete (window as any).scrollToSearchBar;
      }
    };
  }, []);

  // Search form state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [selectedBudget, setSelectedBudget] = useState("All Budgets");
  const [activeTab, setActiveTab] = useState<TabType>("buy");

  const cities = ["Hyderabad", "Delhi NCR", "Mumbai", "Bangalore", "Pune", "Chennai"];
  const budgets = ["All Budgets", "Under ₹3L", "₹3L - ₹5L", "₹5L - ₹10L", "Above ₹10L"];

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const base = "/results";
    const q = searchQuery.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedBudget && selectedBudget !== "All Budgets") params.set("budget", selectedBudget);
    window.location.href = `${base}?${params.toString()}`;
  };

  /* ---------- Small inline Presentational helpers ---------- */

  const MetricCard = ({ value, label }: { value: string; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );

  const TestimonialCard = ({ quote, author, city }: { quote: string; author: string; city: string }) => (
    <article className="card-base p-6 rounded-2xl">
      <div className="mb-3 text-yellow-500">★★★★★</div>
      <blockquote className="italic text-lg mb-4 text-gray-700 dark:text-gray-200">{quote}</blockquote>
      <div className="font-semibold text-gray-900 dark:text-white">{author}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{city}</div>
    </article>
  );

  /* ---------- Main render ---------- */
  return (
    <FullWidthLayout showFooter={true}>
      {/* HERO */}
      <section
        className="hero-custom hero-compact relative flex items-center pt-24 md:pt-28 lg:pt-32"
        aria-label="Hero"
      >
        {/* preload hero image to avoid flash */}
        <img src="/assets/hero_custom.jpg" alt="" style={{ display: "none" }} />

        <div className="relative z-10 w-full container py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[0.6fr_0.4fr] gap-8 items-start">
            {/* Left: Headline + search card */}
            <div>
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.05] mb-3 text-gray-900 dark:text-white"
              >
                Your car.
                <br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--brand), var(--brand-accent))' }}>
                  Found fast.
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl mb-4 leading-relaxed font-light text-gray-700 dark:text-gray-300">
                One search. All platforms. AI-verified listings. No scams.
              </p>

              {/* Search card */}
              <div className="card-base p-5 sm:p-6">
                {/* Buy/Sell */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setActiveTab("buy")}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "buy" ? 'tab-active' : 'tab-default'}`}
                    aria-pressed={activeTab === "buy"}
                  >
                    Buy Car
                  </button>
                  <button
                    onClick={() => setActiveTab("sell")}
                    className={`flex-1 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "sell" ? 'tab-active' : 'tab-default'}`}
                    aria-pressed={activeTab === "sell"}
                  >
                    Sell Car
                  </button>
                </div>

                <form onSubmit={handleSearch} className="space-y-4" aria-label="Home search form">
                  <div>
                    <label htmlFor="location" className="block text-xs font-semibold text-gray-600 mb-2">
                      LOCATION
                    </label>
                    <select
                      id="location"
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all form-token"
                    >
                      {cities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="search" className="block text-xs font-semibold text-gray-600 mb-2">
                      SEARCH BY BRAND, MODEL
                    </label>
                    <input
                      id="search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Swift, Creta, Nexon..."
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                      aria-label="search by brand or model"
                    />
                  </div>

                  <div>
                    <label htmlFor="budget" className="block text-xs font-semibold text-gray-600 mb-2">
                      BUDGET
                    </label>
                    <select
                      id="budget"
                      value={selectedBudget}
                      onChange={(e) => setSelectedBudget(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    >
                      {budgets.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full btn-primary-premium text-base"
                  >
                    Search Cars
                  </button>
                </form>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-2">Popular:</span>
                  {["Swift", "Creta", "Nexon", "City"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSearchQuery(t)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:scale-105 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: visual/pricing panel — clamped image for consistent hero height */}
            <div className="hidden lg:flex items-center justify-center mt-6 md:mt-10" aria-hidden>
              <img
                src="/assets/hero_custom.jpg"
                alt=""
                className="hero-bg-clamped rounded-2xl shadow-lg"
                style={{ objectPosition: 'center', filter: 'brightness(0.95)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED / METRICS */}
      <section className="relative py-12 sm:py-16 lg:py-20">
        <div className="container text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-700 dark:text-gray-200">
            Trusted by Thousands
          </h2>
        </div>
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8 justify-items-center">
          <MetricCard value="50,000+" label="Happy Customers" />
          <MetricCard value="10,000+" label="Verified Cars" />
          <MetricCard value="4.8/5" label="Customer Rating" />
          <MetricCard value="100%" label="AI Verified" />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
        <div className="container">
          <h3 className="text-3xl sm:text-4xl font-bold mb-6">What customers say</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote={`"Found my dream Swift in just 2 days! The AI verification gave me confidence."`}
              author="Rajesh Kumar"
              city="Hyderabad"
            />
            <TestimonialCard
              quote={`"Best car buying experience. No hassle, no scams. Highly recommended!"`}
              author="Priya Sharma"
              city="Delhi"
            />
            <TestimonialCard
              quote={`"Saved ₹50,000 by comparing across all platforms. Thank you CarArth!"`}
              author="Amit Patel"
              city="Mumbai"
            />
          </div>
        </div>
      </section>

      {/* POPULAR MODELS */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-3xl sm:text-4xl font-black">Popular Models</h3>
              <p className="text-sm text-gray-500">Trending cars in Hyderabad</p>
            </div>
            <div>
              <a className="text-blue-600 font-semibold">View All →</a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Maruti Swift", price: "₹4.5L", reviews: "4.5 (450)" },
              { name: "Hyundai Creta", price: "₹12.8L", reviews: "4.7 (470)" },
              { name: "Tata Nexon", price: "₹7.2L", reviews: "4.6 (459)" },
              { name: "Honda City", price: "₹9.5L", reviews: "4.4 (440)" },
            ].map((m) => (
              <div key={m.name} className="card-base p-6 flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-4">🚗</div>
                  <h4 className="font-bold text-lg mb-1">{m.name}</h4>
                  <div className="text-xs text-yellow-500 mb-2">★ {m.reviews}</div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-xl font-black">{m.price}</div>
                    <div className="text-xs text-gray-500">2020 onwards</div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-semibold btn-secondary">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY BUDGET */}
      <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
        <div className="container text-center mb-8">
          <h3 className="text-3xl sm:text-4xl font-black">Shop by Budget</h3>
        </div>

          <div className="container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl p-8 text-left budget-card">
            <div className="text-5xl mb-4">₹</div>
            <h4 className="text-2xl font-black mb-2">Under ₹3 Lakh</h4>
            <div className="text-sm">2,500+ cars</div>
            <div className="mt-6 font-semibold">Explore →</div>
          </div>

          <div className="rounded-2xl p-8 text-left budget-card">
            <div className="text-5xl mb-4">₹</div>
            <h4 className="text-2xl font-black mb-2">₹3L - ₹5L</h4>
            <div className="text-sm">3,800+ cars</div>
            <div className="mt-6 font-semibold">Explore →</div>
          </div>

          <div className="rounded-2xl p-8 text-left budget-card">
            <div className="text-5xl mb-4">₹</div>
            <h4 className="text-2xl font-black mb-2">₹5L - ₹10L</h4>
            <div className="text-sm">2,200+ cars</div>
            <div className="mt-6 font-semibold">Explore →</div>
          </div>

          <div className="rounded-2xl p-8 text-left budget-card">
            <div className="text-5xl mb-4">₹</div>
            <h4 className="text-2xl font-black mb-2">Above ₹10L</h4>
            <div className="text-sm">1,500+ cars</div>
            <div className="mt-6 font-semibold">Explore →</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-12 sm:py-16 lg:py-20 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
        <div className="container text-center mb-12">
          <h3 className="text-4xl sm:text-4xl font-black">How It Works</h3>
          <p className="text-gray-500 mt-3">Buy your dream car in 3 simple steps</p>
        </div>

        <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="mx-auto mb-4" style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(90deg, color-mix(in srgb, var(--brand-accent) 60%, var(--brand) 40%))', display: "flex", alignItems: "center", justifyContent: "center", color: "var(--white)" }}>
              🔍
            </div>
            <h4 className="font-bold mb-2">Search & Filter</h4>
            <p className="text-gray-500">Find your perfect car from 10,000+ verified listings</p>
          </div>

          <div className="text-center p-6">
            <div className="mx-auto mb-4" style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(90deg, var(--success), var(--brand))', display: "flex", alignItems: "center", justifyContent: "center", color: "var(--white)" }}>
              🛡
            </div>
            <h4 className="font-bold mb-2">AI Verification</h4>
            <p className="text-gray-500">Every listing is verified by our multi-LLM AI system</p>
          </div>

          <div className="text-center p-6">
            <div className="mx-auto mb-4" style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(90deg, color-mix(in srgb, var(--brand-accent) 60%, #FF6B35 40%))', display: "flex", alignItems: "center", justifyContent: "center", color: "var(--white)" }}>
              🚗
            </div>
            <h4 className="font-bold mb-2">Buy with Confidence</h4>
            <p className="text-gray-500">Complete paperwork and drive home your car</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container max-w-5xl mx-auto">
          <h3 className="text-4xl sm:text-4xl font-black mb-8">Common Questions</h3>

          <div className="space-y-4">
            {[
              {
                q: "What is CarArthX?",
                a: "India's first unified used car search. We search Cars24, Spinny, OLX, CarWale, and Facebook Marketplace—all in one place. AI-verified for authenticity.",
              },
              { q: "Is it free?", a: "100% free. No commissions. No hidden fees. Ever." },
              {
                q: "How does AI verification work?",
                a: "Our AI scans every listing for pricing anomalies, scam patterns, and fake details. You only see real listings.",
              },
              { q: "Which cities?", a: "Live in Hyderabad now. Delhi NCR coming soon. More cities after." },
            ].map((faq, i) => (
              <details key={i} className="p-6 rounded-2xl border border-theme">
                <summary className="cursor-pointer font-semibold mb-2">{faq.q}</summary>
                <p className="text-gray-500 mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 lg:py-20" style={{ background: 'linear-gradient(90deg, var(--brand), var(--brand-accent))' }}>
        <div className="container max-w-5xl mx-auto text-center text-white">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">Ready to Find Your Dream Car?</h2>
          <p className="mb-8 text-lg">
            Join 50,000+ happy customers who found their perfect car with CarArth.
          </p>
          <button
            type="button"
            onClick={scrollToSearchBar}
            className="px-10 py-3 md:py-4 rounded-2xl font-bold btn-primary-premium"
          >
            Start Searching Now
          </button>
        </div>
      </section>

      {/* FOOTNOTES */}
      <section className="py-12 px-6 sm:px-8 lg:px-12 border-t" style={{ borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" }}>
          <div className="max-w-5xl mx-auto">
          <div className="glass-card-premium">
              <p className="text-xs leading-relaxed font-light text-gray-500 dark:text-gray-400">
              * CarArthX aggregates listings from Cars24, Spinny, OLX, CarWale, and Facebook Marketplace.
              We don't own or sell vehicles. Listings depend on source platform accuracy.
              AI verification filters scams but is not foolproof — always verify before buying.
              Prices may vary. CarArthX is not liable for transactions conducted on external platforms.
            </p>
          </div>
        </div>
      </section>
    </FullWidthLayout>
  );
}
