import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicativeLoanDisclaimerProps {
  className?: string;
  compact?: boolean;
  curtainMode?: boolean; // New curtain dropdown mode
}

/**
 * Universal Indicative Loan Disclaimer Component
 * Must be used wherever EMI/loan calculations are shown
 * Complies with user requirement for universal coverage until bank/NBFC partnerships exist
 */
export function IndicativeLoanDisclaimer({ 
  className, 
  compact = false,
  curtainMode = false
}: IndicativeLoanDisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // Curtain mode - collapsible disclaimer inspired by Spinny.com
  if (curtainMode) {
    return (
      <div 
        className={cn(
          "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md overflow-hidden",
          className
        )}
        data-testid="text-loan-disclaimer"
      >
        {/* Compact header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between gap-2 p-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200 font-medium text-left">
              Indicative estimates only. Rates subject to credit profile and bank approval.
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          )}
        </button>
        
        {/* Expanded content - curtain effect */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="px-4 pb-4 border-t border-yellow-200 dark:border-yellow-800 pt-3">
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <div className="space-y-2">
                <p>• <strong>Not a loan offer or sanction.</strong> These are estimates for comparison purposes only.</p>
                <p>• Final approval, interest rates, fees and terms are solely at the discretion of lending institutions.</p>
                <p>• Subject to KYC verification, underwriting, documentation, and institutional policies.</p>
                <p>• Actual EMI may vary due to credit profile, income, tenure, insurance, processing fees, taxes and charges.</p>
                <p>• Rates and fees may change without notice. Additional charges may affect total cost.</p>
                <p>• <strong>CarArth is not a lender or financial advisor.</strong> We help you compare options.</p>
              </div>
              <div className="font-semibold mt-3 text-yellow-700 dark:text-yellow-300">
                📋 Always verify details directly with your chosen financial institution
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div 
        className={cn(
          "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-2",
          className
        )}
        data-testid="text-loan-disclaimer"
      >
        <div className="flex items-center gap-2">
          <Info className="w-3 h-3 text-yellow-600 flex-shrink-0" />
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Indicative estimates only.</strong> Not a loan offer. Final approval subject to bank/NBFC policies, KYC & documentation. CarArth is not a lender.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3",
        className
      )}
      data-testid="text-loan-disclaimer"
    >
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-yellow-800 dark:text-yellow-200">
          <div className="font-semibold mb-1">📊 Indicative Estimates Only</div>
          <div className="space-y-1">
            <p>• <strong>Not a loan offer or sanction.</strong> These are estimates for comparison purposes only.</p>
            <p>• Final approval, interest rates, fees and terms are solely at the discretion of lending institutions.</p>
            <p>• Subject to KYC verification, underwriting, documentation, and institutional policies.</p>
            <p>• Actual EMI may vary due to credit profile, income, tenure, insurance, processing fees, taxes and charges.</p>
            <p>• Rates and fees may change without notice. Additional charges may affect total cost.</p>
            <p>• <strong>CarArth is not a lender or financial advisor.</strong> We help you compare options.</p>
          </div>
          <div className="font-semibold mt-2 text-yellow-700 dark:text-yellow-300">
            📋 Always verify details directly with your chosen financial institution
          </div>
        </div>
      </div>
    </div>
  );
}