import { Info } from "lucide-react";

export function BadgeLegend() {
  return (
    <div
      className="rounded-2xl p-5 mb-6 border-2 backdrop-blur-md transition-all duration-300"
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        boxShadow: '0 4px 24px rgba(59, 130, 246, 0.1)'
      }}
    >
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Understanding Listing Sources
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="bg-green-500 text-white dark:bg-green-600 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg backdrop-blur-sm">
                🧠 Ethical AI
              </span>
              <p className="text-gray-900 dark:text-white font-medium">
                Listings sourced and verified by CarArth's AI from public data
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-500 text-white dark:bg-blue-600 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg backdrop-blur-sm">
                🤝 Dealer
              </span>
              <p className="text-gray-900 dark:text-white font-medium">
                Listings from CarArth's verified dealer partners
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-orange-500 text-white dark:bg-orange-600 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg backdrop-blur-sm">
                👤 User
              </span>
              <p className="text-gray-900 dark:text-white font-medium">
                Listings posted directly by individual sellers like you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
