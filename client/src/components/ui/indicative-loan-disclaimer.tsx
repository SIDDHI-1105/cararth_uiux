import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndicativeLoanDisclaimerProps {
  className?: string;
  compact?: boolean;
}

/**
 * Universal Indicative Loan Disclaimer Component
 * Must be used wherever EMI/loan calculations are shown
 * Complies with user requirement for universal coverage until bank/NBFC partnerships exist
 */
export function IndicativeLoanDisclaimer({ 
  className, 
  compact = false 
}: IndicativeLoanDisclaimerProps) {
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