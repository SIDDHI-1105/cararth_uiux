import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Eye,
  Car,
  Calendar,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { Link } from 'wouter';

export default function AdminReviewPage() {
  const { toast } = useToast();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  const { data: flaggedData, isLoading } = useQuery({
    queryKey: ['/api/admin/review/flagged'],
  });

  const flaggedListings = (flaggedData as any)?.listings || [];

  const reviewMutation = useMutation({
    mutationFn: async ({ listingId, action, notes }: { listingId: string; action: 'approve' | 'reject'; notes: string }) => {
      const response = await fetch(`/api/admin/review/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });
      if (!response.ok) throw new Error('Failed to review listing');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/review/flagged'] });
      setIsReviewDialogOpen(false);
      setSelectedListing(null);
      setReviewNotes('');
      toast({
        title: variables.action === 'approve' ? 'Listing approved' : 'Listing rejected',
        description: `Listing has been ${variables.action === 'approve' ? 'approved' : 'rejected'} successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to review listing',
        variant: 'destructive',
      });
    },
  });

  const handleReview = (listing: any) => {
    setSelectedListing(listing);
    setReviewNotes('');
    setIsReviewDialogOpen(true);
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) {
      return <Badge className="bg-red-500 dark:bg-red-600" data-testid={`badge-risk-high`}><AlertTriangle className="w-3 h-3 mr-1" />High Risk</Badge>;
    } else if (score >= 40) {
      return <Badge className="bg-yellow-500 dark:bg-yellow-600" data-testid={`badge-risk-medium`}><AlertCircle className="w-3 h-3 mr-1" />Medium Risk</Badge>;
    } else {
      return <Badge className="bg-blue-500 dark:bg-blue-600" data-testid={`badge-risk-low`}><Shield className="w-3 h-3 mr-1" />Low Risk</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white" data-testid="text-page-title">
            Review Queue
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-2">
            Review flagged listings from partner sources
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <Tabs defaultValue="review" className="mb-8">
          <TabsList className="bg-muted dark:bg-gray-900">
            <TabsTrigger value="partners" asChild>
              <Link href="/admin/partners" data-testid="tab-partners">
                Partners
              </Link>
            </TabsTrigger>
            <TabsTrigger value="review" data-testid="tab-review">
              <AlertCircle className="w-4 h-4 mr-2" />
              Review Queue
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground dark:text-gray-400">
                Pending Review
              </CardDescription>
              <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-pending">
                {flaggedListings.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground dark:text-gray-400">
                <AlertCircle className="w-4 h-4 mr-2" />
                Flagged by AI
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground dark:text-gray-400">
                High Risk
              </CardDescription>
              <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-high-risk">
                {flaggedListings.filter((l: any) => (l.riskScore || 0) >= 70).length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Priority review
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-muted-foreground dark:text-gray-400">
                Avg Risk Score
              </CardDescription>
              <CardTitle className="text-3xl text-foreground dark:text-white" data-testid="stat-avg-risk">
                {flaggedListings.length > 0
                  ? Math.round(flaggedListings.reduce((sum: number, l: any) => sum + (l.riskScore || 0), 0) / flaggedListings.length)
                  : 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground dark:text-gray-400">
                <Shield className="w-4 h-4 mr-2" />
                Out of 100
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Listings */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-muted dark:bg-gray-900" />
              </Card>
            ))}
          </div>
        ) : flaggedListings.length === 0 ? (
          <Card className="bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white mb-2">
                All clear!
              </h3>
              <p className="text-muted-foreground dark:text-gray-400">
                No listings pending review at the moment
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {flaggedListings.map((listing: any) => {
              const data = listing.normalizedData || {};
              return (
                <Card
                  key={listing.id}
                  className="bg-card dark:bg-gray-900 border-border dark:border-gray-800"
                  data-testid={`card-listing-${listing.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-foreground dark:text-white" data-testid={`text-listing-title-${listing.id}`}>
                            {data.make} {data.model} {data.year}
                          </CardTitle>
                          {getRiskBadge(listing.riskScore || 0)}
                        </div>
                        <CardDescription className="text-muted-foreground dark:text-gray-400">
                          Source: {listing.sourceId} • ID: {listing.sourceListingId}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400 border-yellow-600 dark:border-yellow-400">
                        {listing.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {data.price && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground dark:text-white font-medium">
                            ₹{parseInt(data.price).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {data.year && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground dark:text-white">{data.year}</span>
                        </div>
                      )}
                      {data.mileage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Car className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground dark:text-white">{data.mileage} km</span>
                        </div>
                      )}
                      {data.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground dark:text-white">{data.city}</span>
                        </div>
                      )}
                    </div>

                    {listing.flaggedReasons && listing.flaggedReasons.length > 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                              Flagged Issues
                            </div>
                            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                              {listing.flaggedReasons.map((reason: string, idx: number) => (
                                <li key={idx} data-testid={`text-flag-reason-${listing.id}-${idx}`}>
                                  • {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {listing.vin && (
                      <div className="mb-4 text-sm">
                        <span className="text-muted-foreground dark:text-gray-400">VIN: </span>
                        <span className="font-mono text-foreground dark:text-white">{listing.vin}</span>
                      </div>
                    )}

                    {listing.registrationNumber && (
                      <div className="mb-4 text-sm">
                        <span className="text-muted-foreground dark:text-gray-400">Registration: </span>
                        <span className="font-mono text-foreground dark:text-white">{listing.registrationNumber}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReview(listing)}
                        data-testid={`button-review-${listing.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                        onClick={() => {
                          if (confirm('Approve this listing?')) {
                            reviewMutation.mutate({ listingId: listing.id, action: 'approve', notes: 'Quick approved' });
                          }
                        }}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-approve-${listing.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => {
                          if (confirm('Reject this listing?')) {
                            reviewMutation.mutate({ listingId: listing.id, action: 'reject', notes: 'Quick rejected' });
                          }
                        }}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-reject-${listing.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card dark:bg-gray-900 border-border dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-foreground dark:text-white">
                Review Listing Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-gray-400">
                Comprehensive details and AI compliance reports
              </DialogDescription>
            </DialogHeader>

            {selectedListing && (
              <div className="space-y-6">
                {/* Listing Info */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Listing Information</h3>
                  <div className="bg-muted dark:bg-gray-950 p-4 rounded-lg">
                    <pre className="text-sm text-foreground dark:text-white whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(selectedListing.normalizedData || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Risk Assessment</h3>
                  <div className="flex items-center gap-4">
                    {getRiskBadge(selectedListing.riskScore || 0)}
                    <span className="text-2xl font-bold text-foreground dark:text-white">
                      {selectedListing.riskScore || 0}/100
                    </span>
                  </div>
                  {selectedListing.flaggedReasons && selectedListing.flaggedReasons.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {selectedListing.flaggedReasons.map((reason: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground dark:text-white">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Review Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground dark:text-white mb-3">Review Notes</h3>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your review decision..."
                    rows={4}
                    className="bg-background dark:bg-gray-950 border-border dark:border-gray-700 text-foreground dark:text-white"
                    data-testid="input-review-notes"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewDialogOpen(false)}
                    className="flex-1"
                    data-testid="button-cancel-review"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-green-600 dark:text-green-400 border-green-600 dark:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                    onClick={() => {
                      reviewMutation.mutate({
                        listingId: selectedListing.id,
                        action: 'approve',
                        notes: reviewNotes || 'Approved after review',
                      });
                    }}
                    disabled={reviewMutation.isPending}
                    data-testid="button-approve-detailed"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {reviewMutation.isPending ? 'Approving...' : 'Approve Listing'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => {
                      reviewMutation.mutate({
                        listingId: selectedListing.id,
                        action: 'reject',
                        notes: reviewNotes || 'Rejected after review',
                      });
                    }}
                    disabled={reviewMutation.isPending}
                    data-testid="button-reject-detailed"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {reviewMutation.isPending ? 'Rejecting...' : 'Reject Listing'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
