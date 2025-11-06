import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  FileText,
  Download,
  Copy,
  Send,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Code,
  Link as LinkIcon,
  ListChecks,
  GitCompare,
  RotateCcw,
  XCircle
} from 'lucide-react';

interface GeneratedArticle {
  id: string;
  topic: string;
  city: string;
  contentHtml: string;  // Match backend field name
  meta: {
    title: string;
    description: string;
    canonical: string;
    robots: string;
  };
  schema: any;
  internalLinks: Array<{ url: string; anchorText: string; relevance: string }>;
  seoChecklist: {
    pass: string[];
    warn: string[];
  };
  mode: 'A' | 'B';
  mock: boolean;
  publishedUrl?: string;
  publishedAt?: string;
  status: 'draft' | 'published';
}

interface ImpactData {
  impressions7d: { current: number; delta: number; deltaPercent: string };
  impressions28d: { current: number; delta: number; deltaPercent: string };
  geoMentionRate7d: { current: number; delta: number; deltaPercent: string };
  geoMentionRate28d: { current: number; delta: number; deltaPercent: string };
  conversions7d: { current: number; delta: number; deltaPercent: string };
  conversions28d: { current: number; delta: number; deltaPercent: string };
}

export default function CreateArticle() {
  const { toast } = useToast();
  const [topic, setTopic] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async (data: { topic: string; city: string }) => {
      const response = await apiRequest('POST', '/api/aether/content/generate', data);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to generate article');
      }
      
      return result;
    },
    onSuccess: (data) => {
      // Verify article data exists
      if (!data.article) {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Article data missing from response',
        });
        return;
      }
      
      // Extract article from envelope and merge with metadata
      const article = {
        ...data.article,
        mode: data.mode || 'A',
        mock: data.mock || false
      };
      setGeneratedArticle(article);
      toast({
        title: '✓ Article Generated',
        description: `Created SEO-optimized content for "${article.topic}"`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: error.message,
      });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await apiRequest('POST', `/api/aether/content/publish/${articleId}`, {});
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to publish article');
      }
      
      return result;
    },
    onSuccess: async (data) => {
      try {
        // Refetch full article to sync preview
        const response = await apiRequest('GET', `/api/aether/content/${data.articleId}`);
        const fullData = await response.json();
        
        if (!response.ok || !fullData.article) {
          throw new Error('Failed to refetch article data');
        }
        
        // Use mode/mock from refetched data if available, preserve from publish response as fallback
        const article = {
          ...fullData.article,
          mode: fullData.article.mode || data.mode || generatedArticle?.mode || 'A',
          mock: fullData.article.mock !== undefined ? fullData.article.mock : (data.mock || generatedArticle?.mock || false),
          publishedUrl: data.publishedUrl
        };
        setGeneratedArticle(article);
        
        toast({
          title: '✓ Article Published',
          description: data.publishedUrl ? `Published to ${data.publishedUrl}` : 'Article published successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/aether/content/impact/aggregate'] });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Refetch Failed',
          description: 'Article published but preview could not be updated',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Publish Failed',
        description: error.message,
      });
    },
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const response = await apiRequest('POST', `/api/aether/content/unpublish/${articleId}`, {});
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to unpublish article');
      }
      
      return result;
    },
    onSuccess: async (data) => {
      try {
        // Refetch full article to sync preview
        const response = await apiRequest('GET', `/api/aether/content/${data.articleId}`);
        const fullData = await response.json();
        
        if (!response.ok || !fullData.article) {
          throw new Error('Failed to refetch article data');
        }
        
        // Use mode/mock from refetched data, with fallbacks to current state
        const article = {
          ...fullData.article,
          mode: fullData.article.mode || generatedArticle?.mode || 'A',
          mock: fullData.article.mock !== undefined ? fullData.article.mock : (generatedArticle?.mock || false)
        };
        setGeneratedArticle(article);
        
        toast({
          title: '✓ Article Unpublished',
          description: 'Article removed from live site',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Refetch Failed',
          description: 'Article unpublished but preview could not be updated',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unpublish Failed',
        description: error.message,
      });
    },
  });

  // Fetch impact data for published article
  const { data: impactData } = useQuery<ImpactData>({
    queryKey: ['/api/aether/content/impact', generatedArticle?.id],
    enabled: !!generatedArticle?.id && generatedArticle.status === 'published',
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast({
        variant: 'destructive',
        title: 'Topic Required',
        description: 'Please enter a topic for the article',
      });
      return;
    }
    generateMutation.mutate({ topic, city });
  };

  const handleCopy = async (content: string, label: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
      toast({
        title: '✓ Copied',
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
      });
    }
  };

  const handleDownloadZip = () => {
    if (!generatedArticle) return;
    
    // Create a simple text file bundle (in production, this would be a real ZIP)
    const bundle = `
=== ${generatedArticle.topic} ===

HTML Content:
${generatedArticle.contentHtml || ''}

Meta Tags:
Title: ${generatedArticle.meta?.title || 'N/A'}
Description: ${generatedArticle.meta?.description || 'N/A'}
Canonical: ${generatedArticle.meta?.canonical || 'N/A'}
Robots: ${generatedArticle.meta?.robots || 'N/A'}

Schema JSON-LD:
${JSON.stringify(generatedArticle.schema || {}, null, 2)}

Internal Links:
${(generatedArticle.internalLinks || []).map(link => `- ${link.anchorText}: ${link.url}`).join('\n')}
`;

    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `article-${generatedArticle.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: '✓ Downloaded',
      description: 'Article bundle downloaded',
    });
  };

  const renderMetricDelta = (metric: { current: number; delta: number; deltaPercent: string }, label: string) => {
    const isPositive = metric.delta >= 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

    return (
      <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded" data-testid={`metric-${label.toLowerCase().replace(/\s/g, '-')}`}>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <div className={`flex items-center gap-1 ${colorClass} font-semibold`}>
          <TrendIcon className="h-3 w-3" />
          <span>{isPositive ? '+' : ''}{metric.deltaPercent}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="create-article-container">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <FileText className="h-6 w-6" />
          Create SEO Content
        </h2>
        <p className="text-muted-foreground mt-1">
          Generate hyperlocal, SEO-optimized articles with auto-metadata
        </p>
      </div>

      {/* Input Form */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Article Parameters</CardTitle>
          <CardDescription>Enter the topic and target city for your content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input
                placeholder="e.g., Best used cars under 5 lakhs"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={generateMutation.isPending}
                data-testid="input-topic"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select value={city} onValueChange={setCity} disabled={generateMutation.isPending}>
                <SelectTrigger data-testid="select-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Pune">Pune</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !topic.trim()}
            className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            data-testid="button-generate"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Article
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {generateMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Pane */}
      {generatedArticle && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: HTML Preview */}
          <Card data-testid="preview-pane">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Content Preview
              </CardTitle>
              {generatedArticle.mock && (
                <Badge variant="outline" className="w-fit">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Mock Mode
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div 
                className="prose dark:prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: generatedArticle.contentHtml }}
                data-testid="html-preview"
              />
            </CardContent>
          </Card>

          {/* Right: Metadata Tabs */}
          <div className="space-y-4">
            <Card>
              <Tabs defaultValue="meta" className="w-full">
                <CardHeader className="pb-3">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="meta" data-testid="tab-meta">Meta</TabsTrigger>
                    <TabsTrigger value="schema" data-testid="tab-schema">Schema</TabsTrigger>
                    <TabsTrigger value="links" data-testid="tab-links">Links</TabsTrigger>
                    <TabsTrigger value="checklist" data-testid="tab-checklist">SEO</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="meta" className="space-y-3">
                    {generatedArticle.meta ? (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Title</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block overflow-x-auto" data-testid="text-meta-title">
                              {generatedArticle.meta.title}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(generatedArticle.meta.title, 'Title')}
                              data-testid="button-copy-title"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Description</label>
                          <div className="flex items-start gap-2 mt-1">
                            <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block overflow-x-auto" data-testid="text-meta-description">
                              {generatedArticle.meta.description}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(generatedArticle.meta.description, 'Description')}
                              data-testid="button-copy-description"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Canonical</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block overflow-x-auto" data-testid="text-meta-canonical">
                              {generatedArticle.meta.canonical}
                            </code>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground">Robots</label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="flex-1 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded block overflow-x-auto" data-testid="text-meta-robots">
                              {generatedArticle.meta.robots}
                            </code>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No meta tags available</div>
                    )}
                  </TabsContent>

                  <TabsContent value="schema">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-muted-foreground">JSON-LD Schema</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(JSON.stringify(generatedArticle.schema, null, 2), 'Schema')}
                        data-testid="button-copy-schema"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy JSON
                      </Button>
                    </div>
                    <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded overflow-x-auto max-h-96" data-testid="text-schema-json">
                      {JSON.stringify(generatedArticle.schema, null, 2)}
                    </pre>
                  </TabsContent>

                  <TabsContent value="links" className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Internal Links ({generatedArticle.internalLinks?.length || 0})</label>
                    {(generatedArticle.internalLinks || []).map((link, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-800 rounded" data-testid={`internal-link-${idx}`}>
                        <div className="flex items-start gap-2">
                          <LinkIcon className="h-3 w-3 mt-0.5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{link.anchorText}</div>
                            <code className="text-xs text-muted-foreground truncate block">{link.url}</code>
                            <Badge variant="outline" className="text-xs mt-1">{link.relevance}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="checklist" className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">SEO Checklist</label>
                    {generatedArticle.seoChecklist && typeof generatedArticle.seoChecklist === 'object' ? (
                      <>
                        {/* Pass items */}
                        {(generatedArticle.seoChecklist.pass || []).map((item, idx) => (
                          <div key={`pass-${idx}`} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded" data-testid={`checklist-item-pass-${idx}`}>
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs font-medium">{item}</div>
                            </div>
                          </div>
                        ))}
                        {/* Warn items */}
                        {(generatedArticle.seoChecklist.warn || []).map((item, idx) => (
                          <div key={`warn-${idx}`} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded" data-testid={`checklist-item-warn-${idx}`}>
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs font-medium">{item}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No SEO checklist available</div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Publish Section */}
            <Card className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-base">Publish Actions</CardTitle>
                <CardDescription>Mode {generatedArticle.mode}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {generatedArticle.mode === 'A' ? (
                  // Mode A: Download & Copy
                  <>
                    <Button
                      onClick={handleDownloadZip}
                      className="w-full"
                      variant="outline"
                      data-testid="button-download-zip"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download ZIP
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(JSON.stringify(generatedArticle.meta, null, 2), 'Meta JSON')}
                        data-testid="button-copy-meta-json"
                      >
                        {copiedItem === 'Meta JSON' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(JSON.stringify(generatedArticle.schema, null, 2), 'Schema JSON')}
                        data-testid="button-copy-schema-json"
                      >
                        {copiedItem === 'Schema JSON' ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </>
                ) : (
                  // Mode B: Publish/Unpublish
                  <>
                    {generatedArticle.status === 'draft' ? (
                      <Button
                        onClick={() => publishMutation.mutate(generatedArticle.id)}
                        disabled={publishMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                        data-testid="button-publish"
                      >
                        {publishMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Publish to Live
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle2 className="h-4 w-4" />
                          <div>
                            <div className="font-semibold">Published</div>
                            <a href={generatedArticle.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" data-testid="link-published-url">
                              {generatedArticle.publishedUrl}
                            </a>
                          </div>
                        </div>
                        <Button
                          onClick={() => unpublishMutation.mutate(generatedArticle.id)}
                          disabled={unpublishMutation.isPending}
                          variant="outline"
                          className="w-full"
                          data-testid="button-unpublish"
                        >
                          {unpublishMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Unpublishing...
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Unpublish
                            </>
                          )}
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" disabled data-testid="button-diff">
                            <GitCompare className="mr-1 h-3 w-3" />
                            Diff
                          </Button>
                          <Button size="sm" variant="outline" disabled data-testid="button-rollback">
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Rollback
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Impact Panel */}
            {impactData && generatedArticle.status === 'published' && (
              <Card className="border-2 border-green-200 dark:border-green-800" data-testid="impact-panel">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Impact Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">7-Day Deltas</div>
                    {renderMetricDelta(impactData.impressions7d, 'GSC Impressions')}
                    {renderMetricDelta(impactData.geoMentionRate7d, 'GEO Mention Rate')}
                    {renderMetricDelta(impactData.conversions7d, 'GA4 Conversions')}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">28-Day Deltas</div>
                    {renderMetricDelta(impactData.impressions28d, 'GSC Impressions')}
                    {renderMetricDelta(impactData.geoMentionRate28d, 'GEO Mention Rate')}
                    {renderMetricDelta(impactData.conversions28d, 'GA4 Conversions')}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
