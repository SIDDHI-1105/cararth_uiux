import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KeyMetric {
  metric: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

interface InfographicSection {
  type: 'stat' | 'chart' | 'trend' | 'comparison' | 'forecast';
  title: string;
  data: any;
  visualization: string;
  insight: string;
}

interface McKinseyInsightProps {
  insight: {
    infographic: {
      id: string;
      title: string;
      executiveSummary: string;
      keyMetrics: KeyMetric[];
      sections: InfographicSection[];
      dataSources: Array<{
        name: string;
        type: 'primary' | 'secondary';
        credibility: string;
      }>;
      actionableInsights: string[];
      timestamp: string;
      powered_by: string;
    };
  };
}

export function McKinseyInsightCard({ insight }: McKinseyInsightProps) {
  const { infographic } = insight;

  if (!infographic) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Executive Summary */}
      <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {infographic.title}
            </CardTitle>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {infographic.powered_by}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            {infographic.executiveSummary}
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {infographic.keyMetrics?.map((metric, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-3xl">{metric.icon}</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.metric}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="flex items-center justify-center gap-1 text-sm">
                  {getTrendIcon(metric.trend)}
                  <span className={
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }>
                    {metric.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Infographic Sections */}
      {infographic.sections?.map((section, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800">
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">{section.type.toUpperCase()}</Badge>
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Visualization */}
            {section.type === 'chart' && section.data.segments && (
              <div className="space-y-3">
                {section.data.segments.map((seg: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-32 text-sm font-medium">{seg.name}</div>
                    <div className="flex-1">
                      <div className="h-8 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${seg.value}%`, 
                            backgroundColor: seg.color 
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right font-semibold">{seg.value}%</div>
                  </div>
                ))}
              </div>
            )}

            {/* Stat Display */}
            {section.type === 'stat' && (
              <div className="grid grid-cols-3 gap-4 text-center">
                {Object.entries(section.data).map(([key, value]) => (
                  <div key={key} className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comparison Table */}
            {section.type === 'comparison' && section.data.platforms && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left">Platform</th>
                      <th className="px-4 py-2 text-right">Listings</th>
                      <th className="px-4 py-2 text-right">Avg Price</th>
                      <th className="px-4 py-2 text-right">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.platforms.map((platform: any, i: number) => (
                      <tr key={i} className="border-t dark:border-gray-700">
                        <td className="px-4 py-3 font-medium">{platform.name}</td>
                        <td className="px-4 py-3 text-right">{platform.listings.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{platform.avgPrice}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="outline">{platform.quality}/5</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Insight */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border-l-4 border-amber-500">
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                💡 <strong>Insight:</strong> {section.insight}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actionable Insights */}
      <Card className="border-l-4 border-l-green-600">
        <CardHeader>
          <CardTitle>Actionable Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {infographic.actionableInsights?.map((action, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                <span className="flex-1 text-gray-700 dark:text-gray-300" 
                      dangerouslySetInnerHTML={{ __html: action.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Sources & Credibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {infographic.dataSources?.map((source, idx) => (
              <Badge 
                key={idx} 
                variant={source.type === 'primary' ? 'default' : 'outline'}
                className="text-xs"
              >
                {source.name}
                {source.credibility === 'government' && ' 🏛️'}
                {source.credibility === 'platform' && ' 💻'}
                {source.credibility === 'industry' && ' 📊'}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Last updated: {new Date(infographic.timestamp).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
