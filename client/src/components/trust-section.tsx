import { ShieldCheck, Sparkles, Users, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "AI-Verified Listings",
    description: "Multi-LLM verification using Gemini and Claude ensures authenticity",
    badge: "100% Verified"
  },
  {
    icon: Sparkles,
    title: "No Paid Promotions",
    description: "Every listing gets equal visibility based on relevance, not payment",
    badge: "Unbiased"
  },
  {
    icon: Users,
    title: "Direct Seller Contact",
    description: "Connect directly with verified sellers. No middlemen, no commissions",
    badge: "Zero Fees"
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description: "AI-powered price insights and deal quality scoring for smarter decisions",
    badge: "Data-Driven"
  }
];

export function TrustSection() {
  // Schema.org ItemList for trust features
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Why CarArth is Trusted",
    "description": "Key trust and safety features that make CarArth India's most reliable used car platform",
    "itemListElement": trustPoints.map((point, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": point.title,
      "description": point.description
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <section className="py-20 md:py-28" style={{ backgroundColor: 'var(--background)' }} data-testid="section-trust">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Why CarArth is Trusted
            </h2>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto" style={{ color: 'var(--secondary-text)' }}>
              Built on trust, powered by AI. No compromises on authenticity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {trustPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div key={index} className="glass-card group" data-testid={`card-trust-${index}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 113, 227, 0.15)' }}>
                      <Icon className="w-7 h-7" style={{ color: '#0071E3' }} />
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0, 245, 160, 0.2)', color: '#00F5A0', border: '1px solid rgba(0, 245, 160, 0.3)' }}>
                      {point.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>{point.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--secondary-text)' }}>{point.description}</p>
                </div>
              );
            })}
          </div>

          {/* Learn More Link */}
          <div className="mt-8 text-center">
            <Link href="/guides/ai-verified-used-car-trust-india" className="text-primary hover:underline font-medium">
              Learn more about our AI verification process →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
