import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

export function BadgeLegend() {
  return (
    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 mb-6">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Understanding Listing Sources
            </h3>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  🧠 Ethical AI
                </span>
                <p className="text-gray-700 dark:text-gray-300">
                  Listings sourced and verified by CarArth's AI from public data
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  🤝 Dealer
                </span>
                <p className="text-gray-700 dark:text-gray-300">
                  Listings from CarArth's verified dealer partners
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  👤 User
                </span>
                <p className="text-gray-700 dark:text-gray-300">
                  Listings posted directly by individual sellers like you
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
