import { Shield, Leaf, Zap } from "lucide-react";

export default function KeyInsights() {
  return (
    <div className="py-20 md:py-28" data-testid="section-key-insights" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-5xl md:text-6xl font-bold text-center mb-16 md:mb-20" data-testid="text-key-insights-title" style={{ color: 'var(--foreground)' }}>
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* AI-Verified Listings */}
          <div className="glass-card flex items-start space-x-4" data-testid="card-insight-ai-verified">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(11,29,83,0.12)' }}>
                <Shield className="w-7 h-7" style={{ color: 'var(--brand)' }} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-base leading-relaxed" data-testid="text-insight-ai-verified">
                <strong className="font-bold" style={{ color: 'var(--foreground)' }}>AI-Verified Listings:</strong> <span style={{ color: 'var(--secondary-text)' }}>Multi-LLM checks (e.g., Gemini for OCR, Claude for compliance) ensure trust and accuracy.</span>
              </p>
            </div>
          </div>

          {/* Carbon Savings Dashboard */}
          <div className="glass-card flex items-start space-x-4" data-testid="card-insight-carbon-savings">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(0,245,160,0.12)' }}>
                <Leaf className="w-7 h-7" style={{ color: 'var(--success)' }} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-base leading-relaxed" data-testid="text-insight-carbon-savings">
                <strong className="font-bold" style={{ color: 'var(--foreground)' }}>Carbon Savings Dashboard:</strong> <span style={{ color: 'var(--secondary-text)' }}>Quantifies CO₂ reductions for each sale, promoting eco-friendly choices.</span>
              </p>
            </div>
          </div>

          {/* One-Upload Syndication */}
          <div className="glass-card flex items-start space-x-4" data-testid="card-insight-syndication">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(197,154,78,0.10)' }}>
                <Zap className="w-7 h-7" style={{ color: 'var(--brand-accent)' }} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-base leading-relaxed" data-testid="text-insight-syndication">
                <strong className="font-bold" style={{ color: 'var(--foreground)' }}>One-Upload Syndication:</strong> <span style={{ color: 'var(--secondary-text)' }}>Maximizes reach by distributing listings to platforms like OLX, Cars24, CarDekho, and Facebook Marketplace.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
