import { useState, useEffect, useRef } from "react";
import { Mic, Search } from "lucide-react";
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
      {/* Hero Section - Maximum Negative Space with Glassmorphic Elements */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Headline - Huge, Minimal */}
          <h1
            style={{
              color: isDark ? "#f5f5f7" : "#1d1d1f",
            }}
            className="text-6xl sm:text-7xl lg:text-8xl font-900 tracking-tighter leading-none mb-8 animate-fade-in transition-colors duration-300"
          >
            Find your perfect
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0071E3] to-[#0077ED]">
              pre-loved car
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
            ref={searchBarRef}
            className="glass-card backdrop-blur-[20px] rounded-full border flex items-center gap-3 px-6 py-4 mb-8 animate-slide-up transition-all duration-300"
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
              borderColor: isDark
                ? focusedInput ? "rgba(0, 113, 227, 0.5)" : "rgba(255, 255, 255, 0.15)"
                : focusedInput ? "rgba(0, 113, 227, 0.5)" : "rgba(0, 0, 0, 0.1)",
              boxShadow: focusedInput
                ? "0 0 32px rgba(0, 113, 227, 0.4), 0 8px 32px rgba(0, 0, 0, 0.2)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Search
              style={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)" }}
              className="w-5 h-5"
            />
            <input
              type="text"
              placeholder="Swift under 5 lakh in Hyderabad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              style={{
                backgroundColor: "transparent",
                color: isDark ? "#f5f5f7" : "#1d1d1f",
              }}
              className="flex-1 text-lg outline-none transition-colors duration-300 placeholder:text-opacity-60"
            />
            <button
              onClick={handleMicClick}
              className={`p-2 rounded-full transition-all duration-300 ${
                isListening ? 'bg-red-500/20 shadow-lg shadow-red-500/30' : 'hover:bg-white/10'
              }`}
              title="Voice search"
            >
              <Mic
                style={{ color: isListening ? "#ef4444" : (isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)") }}
                className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`}
              />
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#0071E3] hover:bg-[#0077ED] rounded-full font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/50"
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
              <div className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              <span>Multi-Platform Search</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              <span>AI Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              <span>No Paid Listings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              <span>Real-Time Listings</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why CarArth Section - Glassmorphic Stats Cards */}
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
              className="glass-card backdrop-blur-[12px] p-8 rounded-3xl border transition-all duration-300 hover:scale-105 hover:shadow-glow"
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
              }}
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
              className="glass-card backdrop-blur-[12px] p-8 rounded-3xl border transition-all duration-300 hover:scale-105 hover:shadow-glow"
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
              }}
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
              className="glass-card backdrop-blur-[12px] p-8 rounded-3xl border transition-all duration-300 hover:scale-105 hover:shadow-glow"
              style={{
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
              }}
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

      {/* Quick Stats Grid - Glassmorphic */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t" style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-12" style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}>Why CarArth</h2>

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
              <div
                key={idx}
                className="glass-card backdrop-blur-[12px] p-6 rounded-3xl border transition-all duration-300 hover:scale-105 hover:shadow-glow"
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
                }}
              >
                <p className="text-4xl font-bold text-[#0071E3] mb-2">
                  {stat.number}
                </p>
                <h4 className="text-lg font-semibold mb-2" style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}>{stat.title}</h4>
                <p
                  style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                  className="text-sm transition-colors duration-300 font-medium"
                >
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Glassmorphic Accordion */}
      <section
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        }}
        className="py-20 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300"
      >
        <div className="max-w-4xl mx-auto">
          <h2
            style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
            className="text-4xl font-bold mb-12 transition-colors duration-300"
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                question: "What is CarArth?",
                answer: "CarArth is India's first unified used car search engine. We aggregate listings from Cars24, Spinny, OLX, CarWale, and Facebook Marketplace into one simple search, powered by AI verification to help you find authentic deals."
              },
              {
                question: "Is CarArth free to use?",
                answer: "Yes, CarArth is 100% free for buyers. We don't charge any commissions or fees. Our mission is to make the used car buying process transparent and hassle-free."
              },
              {
                question: "How does AI verification work?",
                answer: "Our multi-LLM AI system analyzes every listing for authenticity markers, pricing anomalies, and potential scam indicators. We screen out fraudulent listings so you only see genuine deals."
              },
              {
                question: "Which cities does CarArth cover?",
                answer: "We're currently live in Hyderabad with deep market intelligence. Delhi NCR is coming soon, with more major cities to follow."
              },
              {
                question: "How often are listings updated?",
                answer: "Our scrapers run continuously to bring you real-time listings. Most listings are updated within hours of being posted on partner platforms."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="glass-card backdrop-blur-[12px] p-6 rounded-2xl border transition-all duration-300 hover:shadow-glow"
                style={{
                  backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.5)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)"
                }}
              >
                <h3
                  style={{ color: isDark ? "#f5f5f7" : "#1d1d1f" }}
                  className="text-lg font-semibold mb-3 transition-colors duration-300"
                >
                  {faq.question}
                </h3>
                <p
                  style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)" }}
                  className="leading-relaxed transition-colors duration-300"
                >
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Glassmorphic */}
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
          <button
            type="button"
            onClick={scrollToSearchBar}
            className="btn-primary text-lg px-8 py-4 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50"
          >
            Search Cars
          </button>
        </div>
      </section>

      {/* Footnotes - Glassmorphic */}
      <section
        style={{
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
        }}
        className="py-8 px-4 sm:px-6 lg:px-8 border-t transition-colors duration-300"
      >
        <div className="max-w-4xl mx-auto">
          <p
            style={{ color: isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(0, 0, 0, 0.4)" }}
            className="text-xs leading-relaxed transition-colors duration-300"
          >
            * CarArth aggregates listings from third-party platforms including Cars24, Spinny, OLX, CarWale, and Facebook Marketplace. We do not own or sell any vehicles directly. All listings are subject to availability and accuracy as provided by source platforms. AI verification is designed to filter potential scams but cannot guarantee authenticity of all listings. Users are advised to conduct their own due diligence before any purchase. Prices shown are indicative and may vary. CarArth is not responsible for any transactions conducted through linked platforms.
          </p>
        </div>
      </section>

    </FullWidthLayout>
  );
}
