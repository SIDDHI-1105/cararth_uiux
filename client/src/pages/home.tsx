// FILE: client/src/pages/home.tsx – Luxury Glassmorphic redesign applied

import { useState, useEffect, useRef } from "react";
import { Mic, Search, Sparkles, Zap, Shield } from "lucide-react";
import { FullWidthLayout } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedInput, setFocusedInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

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

  const handleMicClick = () => {
    // Check for Speech Recognition support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Voice search not supported",
        description: "Your browser doesn't support voice input. Please use Chrome, Edge, or Safari.",
        variant: "destructive"
      });
      return;
    }

    // If already listening, stop
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'en-IN'; // English (India)
    recognition.continuous = false; // Stop after first result
    recognition.interimResults = false; // Only get final results

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak your search query now",
      });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);

      toast({
        title: "Got it!",
        description: `You said: "${transcript}"`,
      });
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      let errorMessage = "Could not process voice input";

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        errorMessage = "Microphone access denied. Please allow microphone permission in your browser settings.";
      } else if (event.error === 'no-speech') {
        errorMessage = "No speech detected. Please try again.";
      } else if (event.error === 'network') {
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast({
        title: "Voice search error",
        description: errorMessage,
        variant: "destructive"
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // Start listening
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setIsListening(false);
      toast({
        title: "Error",
        description: "Failed to start voice input. Please try again.",
        variant: "destructive"
      });
    }
  };

  const scrollToSearchBar = () => {
    searchBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
            Find your perfect
            <br />
            <span
              className="text-transparent bg-clip-text animate-glow-pulse"
              style={{
                backgroundImage: 'linear-gradient(135deg, #0071E3 0%, #00F5A0 50%, #0077ED 100%)',
                backgroundSize: '200% 200%'
              }}
            >
              pre-loved car
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
            Search across Cars24, Spinny, OLX, CarWale, and Facebook Marketplace. AI-powered verification helps you find authentic deals faster.
          </p>

          {/* MASSIVE Floating Search Bar - Premium Glass */}
          <div
            ref={searchBarRef}
            className="glass-search-premium relative group mb-12 animate-slide-in-up"
            style={{
              animationDelay: '0.2s'
            }}
          >
            {/* Pulsing Border Glow on Focus */}
            {focusedInput && (
              <div
                className="absolute -inset-1 rounded-full opacity-75 blur-xl animate-glow-pulse"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 113, 227, 0.6), rgba(0, 245, 160, 0.4))',
                }}
              />
            )}

            <div
              className="relative backdrop-blur-[30px] rounded-full border-2 flex items-center gap-4 px-8 py-6 transition-all duration-500 shadow-2xl"
              style={{
                backgroundColor: isDark
                  ? focusedInput ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)'
                  : focusedInput ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.7)',
                borderColor: isDark
                  ? focusedInput ? 'rgba(0, 113, 227, 0.6)' : 'rgba(255, 255, 255, 0.2)'
                  : focusedInput ? 'rgba(0, 113, 227, 0.4)' : 'rgba(0, 0, 0, 0.08)',
                boxShadow: focusedInput
                  ? '0 0 40px rgba(0, 113, 227, 0.4), 0 20px 60px rgba(0, 0, 0, 0.3)'
                  : '0 20px 60px rgba(0, 0, 0, 0.2)',
                transform: focusedInput ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <Search
                className="w-7 h-7 flex-shrink-0"
                style={{ color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)" }}
              />

              <input
                type="text"
                placeholder="e.g., Swift under 5 lakh in Hyderabad..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 text-xl sm:text-2xl outline-none bg-transparent font-light placeholder:text-opacity-50 transition-all duration-300"
                style={{
                  color: isDark ? "#f5f5f7" : "#1d1d1f",
                }}
              />

              {/* Voice Button with Pulse Animation */}
              <button
                onClick={handleMicClick}
                className={`p-3 rounded-full transition-all duration-300 ${
                  isListening
                    ? 'bg-red-500/20 shadow-lg shadow-red-500/40 scale-110'
                    : 'hover:bg-white/10 hover:scale-110'
                }`}
                title="Voice search"
              >
                <Mic
                  className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`}
                  style={{
                    color: isListening ? "#ef4444" : (isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)")
                  }}
                />
              </button>

              {/* Premium Search Button */}
              <button
                onClick={handleSearch}
                className="btn-primary-premium px-10 py-4 text-lg font-semibold"
              >
                Search
              </button>
            </div>
          </div>

          {/* Live Status Pills - Glassmorphic Badges */}
          <div
            className="flex flex-wrap gap-4 text-base animate-slide-in-up"
            style={{
              animationDelay: '0.3s'
            }}
          >
            {[
              { icon: Sparkles, text: "Multi-Platform Search" },
              { icon: Shield, text: "AI Verification" },
              { icon: Zap, text: "Real-Time Listings" }
            ].map((item, idx) => (
              <div
                key={idx}
                className="glow-badge group"
              >
                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>{item.text}</span>
              </div>
            ))}
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
              Experience the future of car shopping with our AI-powered platform
            </p>
          </div>

          {/* Premium Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "5+",
                color: "#0071E3",
                title: "Platforms Searched",
                description: "Cars24, Spinny, OLX, CarWale, Facebook Marketplace - all in one intelligent search"
              },
              {
                number: "AI",
                color: "#00F5A0",
                title: "Verified Listings",
                description: "Advanced multi-LLM AI screens every listing to filter out scams and fake deals automatically"
              },
              {
                number: "₹0",
                color: "#FF6B35",
                title: "No Hidden Fees",
                description: "100% free for buyers - no commissions, no premium listings, completely transparent"
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
            Platform Intelligence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                number: "5+",
                title: "Platform Aggregation",
                description: "Unified search across OLX, Cars24, Spinny, CarWale, Facebook Marketplace",
              },
              {
                number: "AI",
                title: "Powered Intelligence",
                description: "Multi-LLM verification system for authenticity and fraud detection",
              },
              {
                number: "HYD",
                title: "Hyderabad Focus",
                description: "Deep local market intelligence with real-time pricing data",
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
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                question: "What is CarArthX?",
                answer: "CarArthX is India's first unified used car search engine. We aggregate listings from Cars24, Spinny, OLX, CarWale, and Facebook Marketplace into one simple search, powered by AI verification to help you find authentic deals."
              },
              {
                question: "Is CarArthX free to use?",
                answer: "Yes, CarArthX is 100% free for buyers. We don't charge any commissions or fees. Our mission is to make the used car buying process transparent and hassle-free."
              },
              {
                question: "How does AI verification work?",
                answer: "Our multi-LLM AI system analyzes every listing for authenticity markers, pricing anomalies, and potential scam indicators. We screen out fraudulent listings so you only see genuine deals."
              },
              {
                question: "Which cities does CarArthX cover?",
                answer: "We're currently live in Hyderabad with deep market intelligence. Delhi NCR is coming soon, with more major cities to follow."
              },
              {
                question: "How often are listings updated?",
                answer: "Our scrapers run continuously to bring you real-time listings. Most listings are updated within hours of being posted on partner platforms."
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
            Ready to find your car?
          </h2>

          <p
            className="text-2xl mb-12 max-w-3xl mx-auto leading-relaxed font-light animate-slide-in-up"
            style={{
              color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
              animationDelay: '0.1s'
            }}
          >
            Search across multiple platforms. AI-verified listings. Real-time updates from India's top markets.
          </p>

          <button
            type="button"
            onClick={scrollToSearchBar}
            className="btn-primary-premium text-xl px-12 py-5 animate-slide-in-up shadow-2xl"
            style={{
              animationDelay: '0.2s'
            }}
          >
            Search Cars Now
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
              * CarArthX aggregates listings from third-party platforms including Cars24, Spinny, OLX, CarWale, and Facebook Marketplace. We do not own or sell any vehicles directly. All listings are subject to availability and accuracy as provided by source platforms. AI verification is designed to filter potential scams but cannot guarantee authenticity of all listings. Users are advised to conduct their own due diligence before any purchase. Prices shown are indicative and may vary. CarArthX is not responsible for any transactions conducted through linked platforms.
            </p>
          </div>
        </div>
      </section>

    </FullWidthLayout>
  );
}
