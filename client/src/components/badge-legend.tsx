// FILE: client/src/components/badge-legend.tsx – Luxury Glassmorphic redesign applied

import { Info } from "lucide-react";

export function BadgeLegend() {
  return (
    <div
      className="glass-card-premium p-8 mb-8 border-2 transition-all duration-500 hover:shadow-2xl group"
      style={{
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)'
      }}
    >
      <div className="flex items-start gap-4">
        {/* Info Icon with Glow */}
        <div
          className="p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 flex-shrink-0"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
          }}
        >
          <Info className="w-6 h-6 text-blue-600 dark:text-blue-300" />
        </div>

        <div className="flex-1">
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-6">
            Understanding Listing Sources
          </h3>

          <div className="grid md:grid-cols-3 gap-6 text-sm">
            {/* Ethical AI Badge */}
            <div className="flex items-start gap-3 group/item">
              <div
                className="bg-green-500 text-white dark:bg-green-600 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shadow-xl backdrop-blur-sm transition-all duration-500 group-hover/item:scale-110 group-hover/item:shadow-2xl flex-shrink-0"
                style={{
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'
                }}
              >
                🧠 Ethical AI
              </div>
              <p className="text-gray-900 dark:text-white font-semibold leading-relaxed">
                Listings sourced and verified by CarArthX's AI from public data
              </p>
            </div>

            {/* Dealer Badge */}
            <div className="flex items-start gap-3 group/item">
              <div
                className="bg-blue-500 text-white dark:bg-blue-600 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shadow-xl backdrop-blur-sm transition-all duration-500 group-hover/item:scale-110 group-hover/item:shadow-2xl flex-shrink-0"
                style={{
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
                }}
              >
                🤝 Dealer
              </div>
              <p className="text-gray-900 dark:text-white font-semibold leading-relaxed">
                Listings from CarArthX's verified dealer partners
              </p>
            </div>

            {/* User Badge */}
            <div className="flex items-start gap-3 group/item">
              <div
                className="bg-orange-500 text-white dark:bg-orange-600 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap shadow-xl backdrop-blur-sm transition-all duration-500 group-hover/item:scale-110 group-hover/item:shadow-2xl flex-shrink-0"
                style={{
                  boxShadow: '0 0 20px rgba(249, 115, 22, 0.4)'
                }}
              >
                👤 User
              </div>
              <p className="text-gray-900 dark:text-white font-semibold leading-relaxed">
                Listings posted directly by individual sellers like you
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
