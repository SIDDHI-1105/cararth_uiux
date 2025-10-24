import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, User } from "lucide-react";

interface ListingSourceBadgeProps {
  source: 'ethical_ai' | 'exclusive_dealer' | 'user_direct';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ListingSourceBadge({ source, className = '', size = 'md' }: ListingSourceBadgeProps) {
  const configs = {
    ethical_ai: {
      label: 'Cararth×Ethical AI',
      icon: Sparkles,
      className: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    },
    exclusive_dealer: {
      label: 'Cararth×Exclusive Dealer',
      icon: ShieldCheck,
      className: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    },
    user_direct: {
      label: 'Cararth×User',
      icon: User,
      className: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    },
  };

  const config = configs[source];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${sizeClasses[size]} ${className} font-medium inline-flex items-center gap-1`}
      data-testid={`badge-source-${source}`}
    >
      <Icon className={iconSizes[size]} />
      <span className="hidden sm:inline">{config.label}</span>
      <span className="sm:hidden">
        {source === 'ethical_ai' && 'AI'}
        {source === 'exclusive_dealer' && 'Dealer'}
        {source === 'user_direct' && 'User'}
      </span>
    </Badge>
  );
}
