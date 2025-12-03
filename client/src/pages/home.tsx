// FILE: client/src/pages/home.tsx – Dark/light mode fixed

import { useState, useEffect } from "react";
import { Sparkles, Zap, Shield } from "lucide-react";
import { FullWidthLayout } from "@/components/layout";
import { useTheme } from "@/contexts/ThemeContext";

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <FullWidthLayout showFooter={true}>
      {/* HERO SECTION - Immersive Luxury Glassmorphism */}
      <section className="relative pt-40 pb-32 px-6 sm:px-8 lg:px-12 overflow-hidden">
        {/* Animated Gradient Background with Car Silhouettes */}
        <div className="absolute inset-0 -z-10">
          {/* Primary Gradient Layer */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse at top, rgba(0, 113, 227, 0.15) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0, 245, 160, 0.08) 0%, transparent 50%)'
                : 'radial-gradient(ellipse at top, rgba(0, 113, 227, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(0, 245, 160, 0.05) 0%, transparent 50%)'
            }}
          />

          {/* Floating Ambient Orbs */}
          <div
            className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(0, 113, 227, 0.4) 0%, transparent 70%)',
              animationDelay: '0s',
              animationDuration: '20s'
            }}
          />
          <div
            className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 animate-float"
            style={{
              background: 'radial-gradient(circle, rgba(0, 245, 160, 0.3) 0%, transparent 70%)',
              animationDelay: '5s',
              animationDuration: '25s'
            }}
          />

          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
                : 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
              backgroundSize: '80px 80px'
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Hero Headline - Massive with Glow */}
          <h1
            className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] mb-10 animate-slide-in-up"
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f",
              textShadow: isDark ? '0 0 60px rgba(0, 113, 227, 0.3)' : 'none'
            }}
          >
            Your car.
            <br />
            <span
              className="text-transparent bg-clip-text animate-glow-pulse"
              style={{
                backgroundImage: 'linear-gradient(135deg, #0071E3 0%, #00F5A0 50%, #0077ED 100%)',
                backgroundSize: '200% 200%'
              }}
            >
              Found fast.
            </span>
          </h1>

          {/* Subheading - Premium Typography */}
          <p
            className="text-xl sm:text-2xl max-w-3xl mb-16 leading-relaxed animate-slide-in-up font-light"
            style={{
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
              animationDelay: '0.1s'
            }}
          >
            One search. All platforms. AI-verified listings. No scams.
          </p>

          {/* Spinny-Style Hero Benefits Card */}
          <div
            className="max-w-5xl mx-auto animate-slide-in-up"
            style={{
              animationDelay: '0.2s'
            }}
          >
            <div
              className="backdrop-blur-md rounded-3xl p-8 md:p-10 shadow-2xl border-2"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(147, 51, 234, 0.1)',
              }}
            >
              {/* Toggle Pill */}
              <div className="inline-flex rounded-2xl p-1.5 mb-8 shadow-lg border-2"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'
                }}
              >
                <a
                  href="/"
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300"
                  style={{
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)'
                  }}
                >
                  Buy car
                </a>
                <a
                  href="/sell"
                  className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 hover:bg-white/10"
                  style={{
                    color: isDark ? '#c4b5fd' : '#7c3aed'
                  }}
                >
                  Sell car
                </a>
              </div>

              {/* Title */}
              <h2
                className="text-3xl md:text-4xl font-black mb-8"
                style={{
                  color: isDark ? '#e9d5ff' : '#581c87'
                }}
              >
                Why Choose CarArthX?
              </h2>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Benefit 1 */}
                <article
                  className="rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="text-4xl mb-4">🔧</div>
                  <h4 className="font-bold mb-2 text-lg" style={{ color: isDark ? '#f5f5f7' : '#1d1d1f' }}>
                    AI-Verified Listings
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    Every listing is carefully verified using multi-LLM AI to filter scams and fakes.
                  </p>
                </article>

                {/* Benefit 2 */}
                <article
                  className="rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="text-4xl mb-4">🛡️</div>
                  <h4 className="font-bold mb-2 text-lg" style={{ color: isDark ? '#f5f5f7' : '#1d1d1f' }}>
                    All Platforms. One Search.
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    Search Cars24, Spinny, OLX, CarWale & Facebook Marketplace in one place.
                  </p>
                </article>

                {/* Benefit 3 */}
                <article
                  className="rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="text-4xl mb-4">⚡</div>
                  <h4 className="font-bold mb-2 text-lg" style={{ color: isDark ? '#f5f5f7' : '#1d1d1f' }}>
                    Real-Time Updates
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    Fresh listings appear within hours. Never miss the perfect deal.
                  </p>
                </article>

                {/* Benefit 4 */}
                <article
                  className="rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <div className="text-4xl mb-4">💸</div>
                  <h4 className="font-bold mb-2 text-lg" style={{ color: isDark ? '#f5f5f7' : '#1d1d1f' }}>
                    100% Free Forever
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }}>
                    No commissions. No hidden fees. Completely transparent pricing.
                  </p>
                </article>
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <a
                  href="/"
                  className="inline-block px-10 py-4 rounded-full font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    color: '#ffffff',
                    boxShadow: '0 8px 24px rgba(236, 72, 153, 0.4)'
                  }}
                >
                  Browse Cars
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CARARTHX SECTION - Premium Glass Cards */}
      <section className="relative py-32 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="mb-16 animate-slide-in-up">
            <h2
              className="text-5xl sm:text-6xl font-black mb-6 tracking-tight"
              style={{
                color: isDark ? "#f5f5f7" : "#1d1d1f"
              }}
            >
              Why CarArthX?
            </h2>
            <p
              className="text-xl font-light max-w-3xl"
              style={{
                color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"
              }}
            >
              Smart search. Real listings. Zero fees.
            </p>
          </div>

          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "5+",
                color: "#0071E3",
                title: "All Platforms",
                description: "Cars24, Spinny, OLX, CarWale, Facebook Marketplace in one search"
              },
              {
                number: "AI",
                color: "#00F5A0",
                title: "Scam-Free",
                description: "Multi-LLM AI filters fake listings automatically"
              },
              {
                number: "₹0",
                color: "#FF6B35",
                title: "Free Forever",
                description: "No commissions. No hidden fees. Completely transparent."
              }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-card-premium p-10 animate-slide-in-up group"
                style={{
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                {/* Stat Number with Glow */}
                <div
                  className="text-7xl font-black mb-6 transition-all duration-500 group-hover:scale-110"
                  style={{
                    color: stat.color,
                    textShadow: `0 0 40px ${stat.color}40`
                  }}
                >
                  {stat.number}
                </div>

                <h3
                  className="text-2xl font-bold mb-4"
                  style={{
                    color: isDark ? "#f5f5f7" : "#1d1d1f"
                  }}
                >
                  {stat.title}
                </h3>

                <p
                  className="text-base leading-relaxed font-light"
                  style={{
                    color: isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)"
                  }}
                >
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ADDITIONAL STATS - Premium Grid */}
      <section
        className="relative py-32 px-6 sm:px-8 lg:px-12 border-t"
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-5xl font-black mb-16 tracking-tight"
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f"
            }}
          >
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                number: "5+",
                title: "All Platforms. One Search.",
                description: "OLX, Cars24, Spinny, CarWale, Facebook Marketplace",
              },
              {
                number: "AI",
                title: "Smart Filtering",
                description: "AI removes scams and fake listings automatically",
              },
              {
                number: "HYD",
                title: "Hyderabad Live",
                description: "Real-time pricing and market intelligence",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="glass-card-premium p-8 animate-slide-in-up group"
                style={{
                  animationDelay: `${idx * 0.1}s`
                }}
              >
                <p
                  className="text-6xl font-black mb-4 transition-transform duration-500 group-hover:scale-110"
                  style={{
                    color: "#0071E3",
                    textShadow: "0 0 30px rgba(0, 113, 227, 0.3)"
                  }}
                >
                  {stat.number}
                </p>

                <h4
                  className="text-xl font-bold mb-3"
                  style={{
                    color: isDark ? "#f5f5f7" : "#1d1d1f"
                  }}
                >
                  {stat.title}
                </h4>

                <p
                  className="text-base leading-relaxed font-light"
                  style={{
                    color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"
                  }}
                >
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION - Premium Glassmorphic Accordion */}
      <section
        className="relative py-32 px-6 sm:px-8 lg:px-12 border-t"
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-5xl sm:text-6xl font-black mb-16 tracking-tight"
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f"
            }}
          >
            Common Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                question: "What is CarArthX?",
                answer: "India's first unified used car search. We search Cars24, Spinny, OLX, CarWale, and Facebook Marketplace—all in one place. AI-verified for authenticity."
              },
              {
                question: "Is it free?",
                answer: "100% free. No commissions. No hidden fees. Ever."
              },
              {
                question: "How does AI verification work?",
                answer: "Our AI scans every listing for pricing anomalies, scam patterns, and fake details. You only see real listings."
              },
              {
                question: "Which cities?",
                answer: "Live in Hyderabad now. Delhi NCR coming soon. More cities after."
              },
              {
                question: "How fresh are listings?",
                answer: "Real-time updates. Most listings appear within hours of posting."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="glass-card-premium p-8 hover:shadow-2xl transition-all duration-500 animate-slide-in-up group"
                style={{
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                <h3
                  className="text-xl font-bold mb-4 group-hover:text-[#0071E3] transition-colors duration-300"
                  style={{
                    color: isDark ? "#f5f5f7" : "#1d1d1f"
                  }}
                >
                  {faq.question}
                </h3>

                <p
                  className="text-base leading-relaxed font-light"
                  style={{
                    color: isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(0, 0, 0, 0.65)"
                  }}
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION - Premium Glass Hero Card */}
      <section
        className="relative py-32 px-6 sm:px-8 lg:px-12 border-t"
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"
        }}
      >
        {/* Gradient Background */}
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 113, 227, 0.2) 0%, transparent 70%)'
          }}
        />

        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-6xl sm:text-7xl font-black mb-8 tracking-tight animate-slide-in-up"
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f",
              textShadow: isDark ? '0 0 60px rgba(0, 113, 227, 0.2)' : 'none'
            }}
          >
            Start searching now
          </h2>

          <p
            className="text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-light animate-slide-in-up"
            style={{
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
              animationDelay: '0.1s'
            }}
          >
            5+ platforms. AI-verified. Real-time.
          </p>

          <button
            type="button"
            onClick={scrollToSearchBar}
            className="btn-primary-premium text-xl px-12 py-5 animate-slide-in-up shadow-2xl"
            style={{
              animationDelay: '0.2s'
            }}
          >
            Find Your Car
          </button>
        </div>
      </section>

      {/* FOOTNOTES - Subtle Glass Panel */}
      <section
        className="relative py-12 px-6 sm:px-8 lg:px-12 border-t"
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div
            className="backdrop-blur-md rounded-2xl p-6 border"
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.5)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
            }}
          >
            <p
              className="text-xs leading-relaxed font-light"
              style={{
                color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)"
              }}
            >
              * CarArthX aggregates listings from Cars24, Spinny, OLX, CarWale, and Facebook Marketplace. We don't own or sell vehicles. Listings depend on source platform accuracy. AI verification filters scams but isn't foolproof—always verify before buying. Prices may vary. CarArthX isn't liable for transactions on linked platforms.
            </p>
          </div>
        </div>
      </section>

    </FullWidthLayout>
  );
}
