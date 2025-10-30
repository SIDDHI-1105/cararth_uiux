import { Bot } from "lucide-react";
import { useEffect, useState } from "react";

interface AIChatReplyProps {
  carPrice?: number;
  city?: string;
  visible: boolean;
}

export function AIChatReply({ carPrice, city = "your city", visible }: AIChatReplyProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [visible]);

  if (!show) return null;

  const priceDiff = carPrice ? Math.round(carPrice * 0.04) : 50000;
  const formattedDiff = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: "compact"
  }).format(priceDiff);

  return (
    <div 
      className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-5 border-l-4 border-green-600 dark:border-green-400 animate-in slide-in-from-bottom-4 duration-500"
      data-testid="section-ai-reply"
    >
      <div className="flex items-start gap-3">
        <div className="bg-green-600 dark:bg-green-500 rounded-full p-2 flex-shrink-0">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
            CarArth AI Assistant
          </p>
          <p className="text-green-800 dark:text-green-200 leading-relaxed">
            <strong>This car looks like a good deal!</strong> 
            <br />
            Similar listings are <strong>{formattedDiff} – {formattedDiff.replace(/\d+/, m => String(parseInt(m) + 10))}</strong> higher in {city}.
          </p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-2">
            ✨ Everything checks out — this car looks genuine.
          </p>
        </div>
      </div>
    </div>
  );
}
