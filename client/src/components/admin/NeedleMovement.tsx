import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Search, Brain, Activity } from 'lucide-react';

interface ImpactMetrics {
  seoImpressions: {
    current: number;
    delta7d: number;
    deltaPercent7d: string;
  };
  geoMentions: {
    current: number;
    delta7d: number;
    deltaPercent7d: string;
  };
  engagementConversions: {
    current: number;
    delta7d: number;
    deltaPercent7d: string;
  };
}

export default function NeedleMovement() {
  const { data: metrics, isLoading } = useQuery<ImpactMetrics>({
    queryKey: ['/api/aether/content/impact/aggregate'],
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const renderMetricCard = (
    title: string,
    icon: React.ReactNode,
    current: number,
    deltaPercent: string,
    color: string
  ) => {
    const isPositive = parseFloat(deltaPercent) >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const bgColor = isPositive ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950';

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700" data-testid={`metric-card-${title.toLowerCase().replace(/\s/g, '-')}`}>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100" data-testid={`text-current-${title.toLowerCase().replace(/\s/g, '-')}`}>
              {formatNumber(current)}
            </span>
            <Badge className={`${bgColor} ${trendColor} text-xs px-1.5 py-0 border-0`} data-testid={`badge-delta-${title.toLowerCase().replace(/\s/g, '-')}`}>
              <TrendIcon className="h-3 w-3 mr-0.5" />
              {Math.abs(parseFloat(deltaPercent))}%
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Needle Movement (7d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Needle Movement (7d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No impact data available yet. Generate content to see metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20" data-testid="needle-movement-widget">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Needle Movement (7d)
        </CardTitle>
        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
          Impact from last 5 published articles
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {renderMetricCard(
            'SEO Impressions',
            <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            metrics.seoImpressions.current,
            metrics.seoImpressions.deltaPercent7d,
            'bg-blue-100 dark:bg-blue-900/40'
          )}
          {renderMetricCard(
            'GEO Mentions',
            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
            metrics.geoMentions.current,
            metrics.geoMentions.deltaPercent7d,
            'bg-purple-100 dark:bg-purple-900/40'
          )}
          {renderMetricCard(
            'Engagement',
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />,
            metrics.engagementConversions.current,
            metrics.engagementConversions.deltaPercent7d,
            'bg-green-100 dark:bg-green-900/40'
          )}
        </div>
      </CardContent>
    </Card>
  );
}
