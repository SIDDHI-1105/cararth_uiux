import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Shield, TrendingDown, Clock, Star, Image, CheckCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustScoreBreakdown {
  price: number;
  recency: number;
  demand: number;
  completeness: number;
  imageQuality: number;
  sellerTrust: number;
  googleCompliance?: number;
}

interface TrustScoreCardProps {
  overall: number;
  label: 'Excellent' | 'Good' | 'Fair' | 'Needs Review';
  color: 'green' | 'blue' | 'yellow' | 'orange';
  breakdown: TrustScoreBreakdown;
  className?: string;
}

export function TrustScoreCard({ overall, label, color, breakdown, className }: TrustScoreCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Color classes based on trust score
  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-700 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
      badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      text: 'text-yellow-700 dark:text-yellow-400',
      border: 'border-yellow-200 dark:border-yellow-800',
      badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-700 dark:text-orange-400',
      border: 'border-orange-200 dark:border-orange-800',
      badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    },
  };

  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        colors.border,
        colors.bg,
        className
      )}
      data-testid="trust-score-card"
    >
      {/* Collapsed View - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between hover:opacity-80 transition-opacity"
        data-testid="trust-score-toggle"
      >
        <div className="flex items-center gap-2">
          <Shield className={cn('w-4 h-4', colors.text)} />
          <span className={cn('text-sm font-medium', colors.text)}>
            Trust Score
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-semibold',
              colors.badge
            )}
            data-testid="trust-score-value"
          >
            {overall.toFixed(1)}/100
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium', colors.text)}>
            {label}
          </span>
          {isExpanded ? (
            <ChevronUp className={cn('w-4 h-4', colors.text)} />
          ) : (
            <ChevronDown className={cn('w-4 h-4', colors.text)} />
          )}
        </div>
      </button>

      {/* Expanded View - Score Breakdown */}
      {isExpanded && (
        <div
          className="px-3 pb-3 pt-1 space-y-2 border-t border-gray-200 dark:border-gray-700"
          data-testid="trust-score-breakdown"
        >
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            Transparency breakdown of listing quality:
          </p>

          {/* Price Fairness */}
          <ScoreItem
            icon={<TrendingDown className="w-3.5 h-3.5" />}
            label="Price Fairness"
            score={breakdown.price}
            testId="score-price"
          />

          {/* Recency */}
          <ScoreItem
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Recency"
            score={breakdown.recency}
            testId="score-recency"
          />

          {/* Market Demand */}
          <ScoreItem
            icon={<Star className="w-3.5 h-3.5" />}
            label="Market Demand"
            score={breakdown.demand}
            testId="score-demand"
          />

          {/* Completeness */}
          <ScoreItem
            icon={<CheckCircle className="w-3.5 h-3.5" />}
            label="Completeness"
            score={breakdown.completeness}
            testId="score-completeness"
          />

          {/* Image Quality */}
          <ScoreItem
            icon={<Image className="w-3.5 h-3.5" />}
            label="Image Quality"
            score={breakdown.imageQuality}
            testId="score-image-quality"
          />

          {/* Seller Trust */}
          <ScoreItem
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Seller Trust"
            score={breakdown.sellerTrust}
            testId="score-seller-trust"
          />

          {/* Google Compliance (if available) */}
          {breakdown.googleCompliance !== undefined && breakdown.googleCompliance > 0 && (
            <div className="pt-1 mt-1 border-t border-gray-200 dark:border-gray-700">
              <ScoreItem
                icon={<Award className="w-3.5 h-3.5" />}
                label="Google Compliance Bonus"
                score={breakdown.googleCompliance}
                testId="score-google-compliance"
                isBonus
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ScoreItemProps {
  icon: ReactNode;
  label: string;
  score: number;
  testId: string;
  isBonus?: boolean;
}

function ScoreItem({ icon, label, score, testId, isBonus }: ScoreItemProps) {
  // Color based on score value
  const getScoreColor = (value: number) => {
    if (value >= 90) return 'text-green-600 dark:text-green-400';
    if (value >= 75) return 'text-blue-600 dark:text-blue-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  return (
    <div className="flex items-center justify-between text-xs" data-testid={testId}>
      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <span className={isBonus ? 'italic' : ''}>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              getScoreColor(score)
            )}
            style={{ width: `${score}%`, backgroundColor: 'currentColor' }}
          />
        </div>
        <span className={cn('font-semibold w-8 text-right', getScoreColor(score))}>
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}
