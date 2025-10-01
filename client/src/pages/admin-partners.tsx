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
import { Plus, Edit, Trash2, RefreshCw, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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

export default function AdminPartnersPage() {
  const { toast } = useToast();
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: partnersData, isLoading } = useQuery({
    queryKey: ['/api/admin/partners'],
  });

  const partners = (partnersData as any) || [];

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

                      <div className="flex gap-2 mt-4">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
