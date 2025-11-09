import { Shield, Leaf, Zap } from "lucide-react";

export default function KeyInsights() {
  return (
    <div className="py-12 bg-transparent" data-testid="section-key-insights">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 night:text-white" data-testid="text-key-insights-title">
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI-Verified Listings */}
          <div className="flex items-start space-x-4 glass-card p-5 border-2 border-blue-400/40 night:border-blue-400/30" data-testid="card-insight-ai-verified">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-blue-600 night:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-800 night:text-gray-100" data-testid="text-insight-ai-verified">
                <strong className="text-gray-900 night:text-white">AI-Verified Listings:</strong> Multi-LLM checks (e.g., Gemini for OCR, Claude for compliance) ensure trust and accuracy.
              </p>
            </div>
          </div>

          {/* Carbon Savings Dashboard */}
          <div className="flex items-start space-x-4 glass-card p-5 border-2 border-green-400/40 night:border-green-400/30" data-testid="card-insight-carbon-savings">
            <div className="flex-shrink-0">
              <Leaf className="w-8 h-8 text-green-600 night:text-green-400" />
            </div>
            <div>
              <p className="text-gray-800 night:text-gray-100" data-testid="text-insight-carbon-savings">
                <strong className="text-gray-900 night:text-white">Carbon Savings Dashboard:</strong> Quantifies CO₂ reductions for each sale, promoting eco-friendly choices.
              </p>
            </div>
          </div>

          {/* One-Upload Syndication */}
          <div className="flex items-start space-x-4 glass-card p-5 border-2 border-purple-400/40 night:border-purple-400/30" data-testid="card-insight-syndication">
            <div className="flex-shrink-0">
              <Zap className="w-8 h-8 text-purple-600 night:text-purple-400" />
            </div>
            <div>
              <p className="text-gray-800 night:text-gray-100" data-testid="text-insight-syndication">
                <strong className="text-gray-900 night:text-white">One-Upload Syndication:</strong> Maximizes reach by distributing listings to platforms like OLX, Cars24, CarDekho, and Facebook Marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
