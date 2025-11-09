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
      
      <section className="py-12 bg-background" data-testid="section-trust">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why CarArth is Trusted
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built on trust, powered by AI. No compromises on authenticity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trustPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div key={index} className="glass-card p-6 hover:scale-105 transition-transform" data-testid={`card-trust-${index}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-green-500 text-white night:bg-green-600 rounded-full shadow-sm">
                      {point.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900 night:text-white">{point.title}</h3>
                  <p className="text-sm text-gray-700 night:text-gray-200">{point.description}</p>
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
