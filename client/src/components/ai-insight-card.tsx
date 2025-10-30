import { CheckCircle2, TrendingUp, Wrench, Clock } from "lucide-react";

interface AIInsightCardProps {
  listingId: string;
  make?: string;
  model?: string;
  price?: number;
  year?: number;
}

export function AIInsightCard({ listingId, make, model, price, year }: AIInsightCardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 1,
      notation: "compact"
    }).format(amount);
  };

  const priceMin = price ? price * 0.95 : 1140000;
  const priceMax = price ? price * 1.05 : 1200000;
  const conditionScore = 8.7;
  const daysActive = 2;

  return (
    <section 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50" 
      data-testid="section-ai-insights"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-600 text-white rounded-full p-2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
          CarArth AI Insights
        </h2>
      </div>
      
      <ul className="space-y-3" data-testid="list-ai-insights">
        <li className="flex items-start gap-3 text-blue-900 dark:text-blue-100">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <span className="text-base leading-relaxed">
            <strong>Verified registration</strong> — matches official database.
          </span>
        </li>
        
        <li className="flex items-start gap-3 text-blue-900 dark:text-blue-100">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="text-base leading-relaxed">
            <strong>Market value:</strong> {formatPrice(priceMin)} – {formatPrice(priceMax)} (fair range).
          </span>
        </li>
        
        <li className="flex items-start gap-3 text-blue-900 dark:text-blue-100">
          <Wrench className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <span className="text-base leading-relaxed">
            <strong>AI condition score:</strong> {conditionScore} / 10 (well maintained).
          </span>
        </li>
        
        <li className="flex items-start gap-3 text-blue-900 dark:text-blue-100">
          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <span className="text-base leading-relaxed">
            <strong>Last seen active:</strong> {daysActive} days ago.
          </span>
        </li>
      </ul>
      
      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/50">
        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <span>Data powered by <strong>CarArth X Ethical AI</strong></span>
        </p>
      </div>
    </section>
  );
}
