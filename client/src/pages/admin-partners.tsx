import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, RefreshCw, Activity, AlertCircle, CheckCircle, XCircle, BarChart3, Play, Link as LinkIcon, Copy } from 'lucide-react';
import { Link } from 'wouter';

const partnerSchema = z.object({
  partnerName: z.string().min(1, 'Partner name is required'),
  feedType: z.enum(['webhook', 'csv', 'sftp', 'firecrawl']),
  sourceUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  fieldMapping: z.string().optional(),
  isActive: z.boolean(),
  legalComplianceNotes: z.string().optional(),
  syncFrequencyHours: z.number().min(1).optional(),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

// Analytics and Scrapers Component
function AnalyticsAndScrapers() {
  const { toast } = useToast();
  
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics/source-distribution'],
  });

  const runScrapersMutation = useMutation({
    mutationFn: async (scrapers: string | string[]) => {
      const response = await fetch('/api/admin/scrapers/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrapers }),
      });
      if (!response.ok) throw new Error('Failed to run scrapers');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/source-distribution'] });
      toast({
        title: 'Scrapers completed',
        description: `Added ${data.summary.totalNewListings} new listings from ${data.summary.successful}/${data.summary.totalScrapers} scrapers`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run scrapers',
        variant: 'destructive',
      });
    },
  });

  const analytics = analyticsData as any;

  return (
    <div className="space-y-6">
      {/* Source Distribution */}
      <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground dark:text-white">Source Distribution</CardTitle>
          <CardDescription className="text-muted-foreground dark:text-gray-400">
            Listing breakdown by source portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyticsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted dark:bg-gray-800 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !analytics || !analytics.summary || !analytics.bySource ? (
            <p className="text-muted-foreground">No data available</p>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Total Listings</div>
                  <div className="text-2xl font-bold">{analytics.total || 0}</div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Sources</div>
                  <div className="text-2xl font-bold">{analytics.summary?.totalSources || 0}</div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10">
                  <div className="text-sm text-green-700">Fresh (7 days)</div>
                  <div className="text-2xl font-bold text-green-700">{analytics.summary?.freshListings || 0}</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10">
                  <div className="text-sm text-blue-700">Recent (30 days)</div>
                  <div className="text-2xl font-bold text-blue-700">{analytics.summary?.recentListings || 0}</div>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="space-y-3">
                <h3 className="font-semibold">By Source</h3>
                {analytics.bySource && analytics.bySource.length > 0 ? (
                  analytics.bySource.map((source: any) => {
                    const percentage = analytics.total > 0 ? ((source.total / analytics.total) * 100).toFixed(1) : '0.0';
                    const daysSinceNewest = Math.floor((Date.now() - new Date(source.newest).getTime()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={source.portal} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{source.portal}</span>
                            <Badge variant="outline">{percentage}%</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {source.total} listings
                          </span>
                        </div>
                        
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div 
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex gap-4">
                            <span>Last 7d: {source.last7Days}</span>
                            <span>Last 30d: {source.last30Days}</span>
                          </div>
                          <span className={daysSinceNewest > 7 ? 'text-orange-500' : ''}>
                            Newest: {daysSinceNewest}d ago
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground">No sources found</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scraper Controls */}
      <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground dark:text-white">Manual Scraper Control</CardTitle>
          <CardDescription className="text-muted-foreground dark:text-gray-400">
            Run forum and marketplace scrapers on-demand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => runScrapersMutation.mutate(['team-bhp'])}
              disabled={runScrapersMutation.isPending}
              variant="outline"
              className="justify-start"
              data-testid="button-scrape-team-bhp"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Team-BHP Scraper
            </Button>
            
            <Button
              onClick={() => runScrapersMutation.mutate(['automotive-india'])}
              disabled={runScrapersMutation.isPending}
              variant="outline"
              className="justify-start"
              data-testid="button-scrape-automotive-india"
            >
              <Play className="w-4 h-4 mr-2" />
              Run TheAutomotiveIndia Scraper
            </Button>
            
            <Button
              onClick={() => runScrapersMutation.mutate(['quikr'])}
              disabled={runScrapersMutation.isPending}
              variant="outline"
              className="justify-start"
              data-testid="button-scrape-quikr"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Quikr Scraper
            </Button>
            
            <Button
              onClick={() => runScrapersMutation.mutate(['reddit'])}
              disabled={runScrapersMutation.isPending}
              variant="outline"
              className="justify-start"
              data-testid="button-scrape-reddit"
            >
              <Play className="w-4 h-4 mr-2" />
              Run Reddit Scraper
            </Button>
            
            <Button
              onClick={() => runScrapersMutation.mutate('all')}
              disabled={runScrapersMutation.isPending}
              className="md:col-span-2 bg-primary hover:bg-primary/90"
              data-testid="button-scrape-all"
            >
              <Play className="w-4 h-4 mr-2" />
              {runScrapersMutation.isPending ? 'Running All Scrapers...' : 'Run All Scrapers'}
            </Button>
          </div>
          
          {runScrapersMutation.isPending && (
            <div className="mt-4 p-4 rounded-lg bg-blue-500/10 dark:bg-blue-900/20">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Scraping in progress... This may take 1-2 minutes.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPartnersPage() {
  const { toast } = useToast();
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [currentInviteUrl, setCurrentInviteUrl] = useState('');

  const { data: partnersData, isLoading } = useQuery({
    queryKey: ['/api/admin/partners'],
  });

  const partners = (partnersData as any) || [];

  const generateInviteMutation = useMutation({
    mutationFn: async (listingSourceId: string) => {
      const response = await apiRequest('/api/admin/partners/invite', {
        method: 'POST',
        body: JSON.stringify({ listingSourceId })
      });
      if (!response.ok) throw new Error('Failed to generate invite');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentInviteUrl(data.invite.url);
      setInviteDialogOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invite link',
        variant: 'destructive',
      });
    }
  });

  const copyInviteLink = () => {
    navigator.clipboard.writeText(currentInviteUrl);
    toast({
      title: 'Copied!',
      description: 'Invite link copied to clipboard',
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      let fieldMapping = {};
      try {
        fieldMapping = data.fieldMapping ? JSON.parse(data.fieldMapping) : {};
      } catch (error) {
        throw new Error('Invalid JSON format in field mapping');
      }
      
      const payload = {
        ...data,
        fieldMapping,
        sourceUrl: data.sourceUrl || null,
        legalComplianceNotes: data.legalComplianceNotes || null,
        syncFrequencyHours: data.syncFrequencyHours || null,
      };
      const response = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create partner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Partner created',
        description: 'Partner source has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create partner',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerFormData }) => {
      let fieldMapping = {};
      try {
        fieldMapping = data.fieldMapping ? JSON.parse(data.fieldMapping) : {};
      } catch (error) {
        throw new Error('Invalid JSON format in field mapping');
      }
      
      const payload = {
        ...data,
        fieldMapping,
        sourceUrl: data.sourceUrl || null,
        legalComplianceNotes: data.legalComplianceNotes || null,
        syncFrequencyHours: data.syncFrequencyHours || null,
      };
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update partner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
      setIsEditDialogOpen(false);
      setSelectedPartner(null);
      toast({
        title: 'Partner updated',
        description: 'Partner source has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update partner',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete partner');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] });
      toast({
        title: 'Partner deleted',
        description: 'Partner source has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete partner',
        variant: 'destructive',
      });
    },
  });

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500 dark:bg-green-600" data-testid={`badge-health-${status}`}><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500 dark:bg-yellow-600" data-testid={`badge-health-${status}`}><AlertCircle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case 'down':
        return <Badge className="bg-red-500 dark:bg-red-600" data-testid={`badge-health-${status}`}><XCircle className="w-3 h-3 mr-1" />Down</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-health-${status}`}>Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white" data-testid="text-page-title">
              Partner Management
            </h1>
            <p className="text-muted-foreground dark:text-gray-400 mt-2">
              Manage enterprise partner sources and syndication settings
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-create-partner"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </div>

        {/* Admin Navigation Tabs */}
        <Tabs defaultValue="partners" className="mb-8">
          <TabsList className="bg-muted dark:bg-gray-900">
            <TabsTrigger value="partners" data-testid="tab-partners">
              <Activity className="w-4 h-4 mr-2" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics & Scrapers
            </TabsTrigger>
            <TabsTrigger value="review" asChild>
              <Link href="/admin/review" data-testid="tab-review">
                <AlertCircle className="w-4 h-4 mr-2" />
                Review Queue
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="mt-6">
            {/* Partners List */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="h-24 bg-muted dark:bg-gray-900" />
                    <CardContent className="h-32 bg-muted/50 dark:bg-gray-900/50" />
                  </Card>
                ))}
              </div>
            ) : !partners || partners.length === 0 ? (
              <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
                <CardContent className="py-12 text-center">
                  <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                    No partners yet
                  </h3>
                  <p className="text-muted-foreground dark:text-gray-400 mb-4">
                    Add your first enterprise partner to start syndicating listings
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-partner">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Partner
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners.map((partner: any) => (
                  <Card
                    key={partner.id}
                    className="bg-card dark:bg-gray-900 border-border dark:border-gray-800"
                    data-testid={`card-partner-${partner.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-foreground dark:text-white" data-testid={`text-partner-name-${partner.id}`}>
                            {partner.partnerName}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground dark:text-gray-400">
                            {partner.feedType.toUpperCase()}
                          </CardDescription>
                        </div>
                        {getHealthStatusBadge(partner.healthStatus)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground dark:text-gray-400">Status</span>
                          <Badge
                            variant={partner.isActive ? 'default' : 'secondary'}
                            data-testid={`badge-status-${partner.id}`}
                          >
                            {partner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        {partner.lastSyncAt && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground dark:text-gray-400">Last Sync</span>
                            <span className="text-foreground dark:text-white" data-testid={`text-last-sync-${partner.id}`}>
                              {new Date(partner.lastSyncAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {partner.syncFrequencyHours && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground dark:text-gray-400">Frequency</span>
                            <span className="text-foreground dark:text-white">
                              Every {partner.syncFrequencyHours}h
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mt-4">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => generateInviteMutation.mutate(partner.id)}
                          disabled={generateInviteMutation.isPending}
                          data-testid={`button-invite-${partner.id}`}
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Generate Invite Link
                        </Button>
                        <div className="flex gap-2">
                          <Link href={`/admin/partners/${partner.id}/monitor`} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              data-testid={`button-monitor-${partner.id}`}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Monitor
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPartner(partner);
                              setIsEditDialogOpen(true);
                            }}
                            data-testid={`button-edit-${partner.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete partner "${partner.partnerName}"? This action cannot be undone.`)) {
                                deleteMutation.mutate(partner.id);
                              }
                            }}
                            data-testid={`button-delete-${partner.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsAndScrapers />
          </TabsContent>
        </Tabs>

        {/* Create Partner Dialog */}
        <PartnerDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          title="Add New Partner"
          description="Create a new enterprise partner source for listing syndication"
        />

        {/* Edit Partner Dialog */}
        {selectedPartner && (
          <PartnerDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSubmit={(data) => updateMutation.mutate({ id: selectedPartner.id, data })}
            isPending={updateMutation.isPending}
            title="Edit Partner"
            description="Update partner source configuration"
            defaultValues={{
              partnerName: selectedPartner.partnerName,
              feedType: selectedPartner.feedType,
              sourceUrl: selectedPartner.sourceUrl || '',
              fieldMapping: JSON.stringify(selectedPartner.fieldMapping || {}, null, 2),
              isActive: selectedPartner.isActive,
              legalComplianceNotes: selectedPartner.legalComplianceNotes || '',
              syncFrequencyHours: selectedPartner.syncFrequencyHours || undefined,
            }}
          />
        )}

        {/* Invite Link Dialog */}
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="max-w-lg bg-card dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-foreground dark:text-white">Partner Invite Link Generated</DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-gray-400">
                Share this link with your partner to give them access to their dashboard
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-mono break-all text-foreground dark:text-white">
                  {currentInviteUrl}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyInviteLink}
                  className="flex-1"
                  data-testid="button-copy-invite"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                  data-testid="button-close-invite"
                >
                  Close
                </Button>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                This link expires in 7 days and can be used once.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PartnerFormData) => void;
  isPending: boolean;
  title: string;
  description: string;
  defaultValues?: Partial<PartnerFormData>;
}

function PartnerDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  title,
  description,
  defaultValues,
}: PartnerDialogProps) {
  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: defaultValues || {
      partnerName: '',
      feedType: 'webhook',
      sourceUrl: '',
      fieldMapping: '{}',
      isActive: true,
      legalComplianceNotes: '',
      syncFrequencyHours: undefined,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card dark:bg-gray-900 border-border dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-foreground dark:text-white">{title}</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Partner Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., AutoPortal India"
                      data-testid="input-partner-name"
                      className="bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Feed Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger
                        data-testid="select-feed-type"
                        className="bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                      >
                        <SelectValue placeholder="Select feed type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="csv">CSV Upload</SelectItem>
                      <SelectItem value="sftp">SFTP</SelectItem>
                      <SelectItem value="firecrawl">Firecrawl Scraping</SelectItem>
                      <SelectItem value="crawl4ai">Crawl4AI (Free LLM Scraping)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Source URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://partner.example.com/feed"
                      data-testid="input-source-url"
                      className="bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="syncFrequencyHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Sync Frequency (Hours)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      placeholder="24"
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                      data-testid="input-sync-frequency"
                      className="bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fieldMapping"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Field Mapping (JSON)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder='{"partnerField": "canonicalField"}'
                      rows={4}
                      data-testid="input-field-mapping"
                      className="font-mono text-sm bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legalComplianceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground dark:text-white">Legal Compliance Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Data sharing agreement signed on..."
                      rows={3}
                      data-testid="input-legal-notes"
                      className="bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border dark:border-gray-700 p-4 bg-background dark:bg-gray-950">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-foreground dark:text-white">Active</FormLabel>
                    <div className="text-sm text-muted-foreground dark:text-gray-400">
                      Enable automatic ingestion for this partner
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-is-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-primary hover:bg-primary/90"
                data-testid="button-submit-partner"
              >
                {isPending ? 'Saving...' : 'Save Partner'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
