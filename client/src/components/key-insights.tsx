import { Shield, Leaf, Zap } from "lucide-react";

export default function KeyInsights() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-y border-blue-100 dark:border-blue-900" data-testid="section-key-insights">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100" data-testid="text-key-insights-title">
          Key Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI-Verified Listings */}
          <div className="flex items-start space-x-4 bg-white dark:bg-gray-900 p-5 rounded-lg shadow-sm border border-blue-100 dark:border-blue-800" data-testid="card-insight-ai-verified">
            <div className="flex-shrink-0">
              <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300" data-testid="text-insight-ai-verified">
                <strong className="text-gray-900 dark:text-gray-100">AI-Verified Listings:</strong> Multi-LLM checks (e.g., Gemini for OCR, Claude for compliance) ensure trust and accuracy.
              </p>
            </div>
          </div>

          {/* Carbon Savings Dashboard */}
          <div className="flex items-start space-x-4 bg-white dark:bg-gray-900 p-5 rounded-lg shadow-sm border border-green-100 dark:border-green-800" data-testid="card-insight-carbon-savings">
            <div className="flex-shrink-0">
              <Leaf className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300" data-testid="text-insight-carbon-savings">
                <strong className="text-gray-900 dark:text-gray-100">Carbon Savings Dashboard:</strong> Quantifies CO₂ reductions for each sale, promoting eco-friendly choices.
              </p>
            </div>
          </div>

          {/* One-Upload Syndication */}
          <div className="flex items-start space-x-4 bg-white dark:bg-gray-900 p-5 rounded-lg shadow-sm border border-purple-100 dark:border-purple-800" data-testid="card-insight-syndication">
            <div className="flex-shrink-0">
              <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300" data-testid="text-insight-syndication">
                <strong className="text-gray-900 dark:text-gray-100">One-Upload Syndication:</strong> Maximizes reach by distributing listings to platforms like OLX, Cars24, CarDekho, and Facebook Marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
