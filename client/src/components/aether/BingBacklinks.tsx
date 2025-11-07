import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, ExternalLink, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Backlink {
  id: string;
  date: string;
  siteUrl: string;
  url: string;
  referringDomains: number;
  backlinks: number;
  anchorTexts: Array<{ text: string; count: number }>;
  topReferrers: Array<{ domain: string; count: number }>;
  createdAt: string;
}

export default function BingBacklinks() {
  const { data: backlinksData, isLoading } = useQuery<{ data: Backlink[]; total: number }>({
    queryKey: ['/api/aether/bing/data/backlinks'],
  });

  if (isLoading) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-green-600" />
            Backlinks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading backlink data...</div>
        </CardContent>
      </Card>
    );
  }

  const backlinks = backlinksData?.data || [];
  const totalReferringDomains = backlinks.reduce((sum, b) => sum + (b.referringDomains || 0), 0);
  const totalBacklinks = backlinks.reduce((sum, b) => sum + (b.backlinks || 0), 0);

  const topReferrersData = backlinks
    .flatMap(b => b.topReferrers || [])
    .reduce((acc, ref) => {
      const existing = acc.find(r => r.domain === ref.domain);
      if (existing) {
        existing.count += ref.count;
      } else {
        acc.push({ ...ref });
      }
      return acc;
    }, [] as Array<{ domain: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topAnchorTexts = backlinks
    .flatMap(b => b.anchorTexts || [])
    .reduce((acc, anchor) => {
      const existing = acc.find(a => a.text === anchor.text);
      if (existing) {
        existing.count += anchor.count;
      } else {
        acc.push({ ...anchor });
      }
      return acc;
    }, [] as Array<{ text: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-green-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <LinkIcon className="h-5 w-5 text-green-600" />
          Backlinks Profile
        </CardTitle>
        <CardDescription>External links pointing to your site from other domains</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <LinkIcon className="h-4 w-4" />
              <span className="text-xs font-medium">Total Backlinks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalBacklinks.toLocaleString()}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-green-200 dark:border-green-900">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs font-medium">Referring Domains</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalReferringDomains.toLocaleString()}</p>
          </div>
        </div>

        {backlinks.length > 0 ? (
          <div className="space-y-6">
            {/* Top Referring Domains */}
            {topReferrersData.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Top Referring Domains</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topReferrersData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      type="category" 
                      dataKey="domain" 
                      width={150} 
                      className="text-xs"
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="count" fill="#10b981" name="Backlinks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Anchor Texts */}
            {topAnchorTexts.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Top Anchor Texts</h4>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="space-y-2">
                    {topAnchorTexts.map((anchor, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
                        data-testid={`anchor-${idx}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {anchor.text || '(empty)'}
                          </p>
                        </div>
                        <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          {anchor.count} {anchor.count === 1 ? 'link' : 'links'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Pages with Backlinks */}
            <div>
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Pages with Backlinks</h4>
              <div className="space-y-3">
                {backlinks.slice(0, 5).map((backlink) => (
                  <div 
                    key={backlink.id} 
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`page-${backlink.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate mb-2" title={backlink.url}>
                          {backlink.url}
                        </p>
                        <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                          <span>{backlink.backlinks} backlinks</span>
                          <span>{backlink.referringDomains} domains</span>
                        </div>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
              {backlinks.length > 5 && (
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-3">
                  Showing 5 of {backlinks.length} pages with backlinks
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <LinkIcon className="h-12 w-12 mx-auto mb-2 text-green-400" />
            <p>No backlink data available yet.</p>
            <p className="text-sm mt-2">Backlinks will appear after Bing syncs your link profile.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
