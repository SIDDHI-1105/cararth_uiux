import { Info } from "lucide-react";

export function BadgeLegend() {
  return (
    <div className="glass-contrast rounded-xl p-5 mb-6 border-2 border-blue-400/40 night:border-blue-400/30">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 night:text-blue-300 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900 night:text-white mb-3 legend-heading">
            Understanding Listing Sources
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="bg-green-500 text-white night:bg-green-600 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm">
                🧠 Ethical AI
              </span>
              <p className="text-gray-900 night:text-white font-medium legend-text">
                Listings sourced and verified by CarArth's AI from public data
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-500 text-white night:bg-blue-600 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm">
                🤝 Dealer
              </span>
              <p className="text-gray-900 night:text-white font-medium legend-text">
                Listings from CarArth's verified dealer partners
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-orange-500 text-white night:bg-orange-600 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-sm">
                👤 User
              </span>
              <p className="text-gray-900 night:text-white font-medium legend-text">
                Listings posted directly by individual sellers like you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
