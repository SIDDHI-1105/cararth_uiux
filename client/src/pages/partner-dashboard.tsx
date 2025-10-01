import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Plus, Edit, Trash2, Car, Upload, FileText, Image as ImageIcon, Download, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PartnerDashboard() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    owners: '1',
    city: '',
    location: '',
    description: ''
  });

  const { data: accountData } = useQuery({
    queryKey: ['/api/partner/account'],
  });

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['/api/partner/listings'],
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/partner/listings', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create listing');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/listings'] });
      toast({
        title: 'Success!',
        description: 'Listing added! Live on CarArth.com now!',
      });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/partner/listings/${id}`);
      if (!response.ok) throw new Error('Failed to delete listing');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/listings'] });
      toast({
        title: 'Deleted',
        description: 'Listing removed from CarArth.com',
      });
    }
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ csv, media }: { csv: File; media: File[] }) => {
      const formData = new FormData();
      formData.append('csv', csv);
      media.forEach(file => {
        formData.append('media', file);
      });

      const response = await fetch('/api/partner/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setUploadJobId(data.jobId);
      toast({
        title: 'Upload Started!',
        description: `Processing ${data.totalListings} listings...`,
      });
      setCsvFile(null);
      setMediaFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const { data: jobStatus, isLoading: jobLoading } = useQuery({
    queryKey: ['/api/partner/bulk-upload', uploadJobId],
    enabled: !!uploadJobId,
    refetchInterval: (query) => {
      const status = (query?.state?.data as any)?.job?.status;
      // Keep polling until we reach a terminal state
      const terminalStates = ['completed', 'failed'];
      if (!status) return 2000; // Poll if no status yet
      return terminalStates.includes(status) ? false : 2000;
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      mileage: '',
      fuelType: '',
      transmission: '',
      owners: '1',
      city: '',
      location: '',
      description: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createListingMutation.mutate({
      ...formData,
      year: parseInt(formData.year.toString()),
      price: parseInt(formData.price),
      mileage: parseInt(formData.mileage || '0'),
      owners: parseInt(formData.owners)
    });
  };

  const handleBulkUpload = () => {
    if (!csvFile) {
      toast({
        title: 'CSV Required',
        description: 'Please upload a CSV file with your listings',
        variant: 'destructive'
      });
      return;
    }

    bulkUploadMutation.mutate({ csv: csvFile, media: mediaFiles });
  };

  const handleCsvDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    }
  }, []);

  const handleMediaDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    setMediaFiles(prev => [...prev, ...files]);
  }, []);

  const removeMediaFile = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const downloadSampleCsv = () => {
    const sample = `title,brand,model,year,price,mileage,fuelType,transmission,owners,city,location,description,images
2020 Honda City VX,Honda,City,2020,850000,35000,Petrol,Manual,1,Hyderabad,Banjara Hills,Well maintained Honda City,car1.jpg
2018 Maruti Swift VDI,Maruti Suzuki,Swift,2018,550000,45000,Diesel,Manual,1,Mumbai,Andheri West,Single owner Swift in excellent condition,car2.jpg`;
    
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_listings.csv';
    a.click();
  };

  const listings = (listingsData as any)?.listings || [];
  const job = (jobStatus as any)?.job;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Partner Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {(accountData as any)?.source?.name || 'CarArth Partner'}
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              size="lg"
              data-testid="button-add-listing"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Listing
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              <Car className="mr-2 h-4 w-4" />
              My Inventory ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="bulk-upload" data-testid="tab-bulk-upload">
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                My Inventory ({listings.length})
              </h2>

          {listingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No listings yet. Add your first car!
              </p>
              <Button onClick={() => setShowAddForm(true)} data-testid="button-add-first-listing">
                Add Your First Listing
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {listings.map((listing: any) => (
                <Card key={listing.id} className="p-4" data-testid={`card-listing-${listing.id}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {listing.brand} {listing.model} • {listing.year} • {listing.city}
                      </p>
                      <p className="text-xl font-bold text-blue-600 mt-2">
                        ₹{listing.price?.toLocaleString()}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{listing.mileage} km</span>
                        <span>•</span>
                        <span>{listing.fuelType}</span>
                        <span>•</span>
                        <span>{listing.transmission}</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteListingMutation.mutate(listing.id)}
                      disabled={deleteListingMutation.isPending}
                      data-testid={`button-delete-${listing.id}`}
                    >
                      {deleteListingMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="bulk-upload">
            <div className="space-y-6">
              {/* Instructions */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Bulk Upload Listings
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Upload multiple cars at once using CSV + media files
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadSampleCsv}
                    data-testid="button-download-sample"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Sample CSV
                  </Button>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Required CSV columns:</strong> title, brand, model, year, price, mileage, fuelType, transmission, owners, city
                    <br />
                    <strong>Optional:</strong> location, description, images (comma-separated filenames)
                  </AlertDescription>
                </Alert>
              </Card>

              {/* CSV Upload */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                  1. Upload CSV File
                </h3>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    csvFile
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'
                  }`}
                  onDrop={handleCsvDrop}
                  onDragOver={(e) => e.preventDefault()}
                  data-testid="dropzone-csv"
                >
                  {csvFile ? (
                    <div className="flex items-center justify-center gap-4">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {csvFile.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {(csvFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCsvFile(null)}
                        data-testid="button-remove-csv"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Drag & drop CSV file here, or click to browse
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setCsvFile(file);
                        }}
                        className="hidden"
                        id="csv-upload"
                        data-testid="input-csv"
                      />
                      <Label htmlFor="csv-upload">
                        <Button variant="outline" asChild>
                          <span>Browse Files</span>
                        </Button>
                      </Label>
                    </div>
                  )}
                </div>
              </Card>

              {/* Media Upload */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                  2. Upload Media Files (Optional)
                </h3>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                  onDrop={handleMediaDrop}
                  onDragOver={(e) => e.preventDefault()}
                  data-testid="dropzone-media"
                >
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag & drop images/videos here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Match filenames in CSV "images" column (e.g., car1.jpg, car2.jpg)
                  </p>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setMediaFiles(prev => [...prev, ...files]);
                    }}
                    className="hidden"
                    id="media-upload"
                    data-testid="input-media"
                  />
                  <Label htmlFor="media-upload">
                    <Button variant="outline" asChild>
                      <span>Browse Files</span>
                    </Button>
                  </Label>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">
                      {mediaFiles.length} file(s) selected
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {mediaFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded"
                          data-testid={`media-file-${index}`}
                        >
                          <span className="text-sm truncate text-gray-900 dark:text-white">
                            {file.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMediaFile(index)}
                            data-testid={`button-remove-media-${index}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Upload Button */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                  3. Start Upload
                </h3>
                <Button
                  onClick={handleBulkUpload}
                  disabled={!csvFile || bulkUploadMutation.isPending}
                  size="lg"
                  className="w-full"
                  data-testid="button-start-upload"
                >
                  {bulkUploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      Upload & Process Listings
                    </>
                  )}
                </Button>
              </Card>

              {/* Upload Status */}
              {job && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">
                    Upload Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`font-semibold ${
                        job.status === 'completed' ? 'text-green-600' :
                        job.status === 'failed' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {job.status === 'processing' && <Loader2 className="inline h-4 w-4 animate-spin mr-2" />}
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Progress:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {job.processedRows || 0} / {job.totalRows}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Successful:</span>
                      <span className="font-semibold text-green-600">
                        {job.successfulListings || 0}
                      </span>
                    </div>
                    {job.failedListings > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Failed:</span>
                        <span className="font-semibold text-red-600">
                          {job.failedListings}
                        </span>
                      </div>
                    )}
                    {job.errorMessage && (
                      <Alert variant="destructive">
                        <AlertDescription>{job.errorMessage}</AlertDescription>
                      </Alert>
                    )}
                    {job.status === 'completed' && (
                      <Button
                        onClick={() => {
                          setUploadJobId(null);
                          queryClient.invalidateQueries({ queryKey: ['/api/partner/listings'] });
                          setActiveTab('inventory');
                        }}
                        className="w-full mt-4"
                        data-testid="button-view-inventory"
                      >
                        View Inventory
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Car Listing</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Listing Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 2020 Honda City VX Petrol Manual"
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Honda"
                    required
                    data-testid="input-brand"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="City"
                    required
                    data-testid="input-model"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                    data-testid="input-year"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="500000"
                    required
                    data-testid="input-price"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select
                    value={formData.fuelType}
                    onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                  >
                    <SelectTrigger data-testid="select-fuelType">
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Petrol">Petrol</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="CNG">CNG</SelectItem>
                      <SelectItem value="Electric">Electric</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transmission">Transmission *</Label>
                  <Select
                    value={formData.transmission}
                    onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                  >
                    <SelectTrigger data-testid="select-transmission">
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="Automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mileage">Mileage (km)</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    placeholder="50000"
                    data-testid="input-mileage"
                  />
                </div>
                <div>
                  <Label htmlFor="owners">Owners *</Label>
                  <Select
                    value={formData.owners}
                    onValueChange={(value) => setFormData({ ...formData, owners: value })}
                  >
                    <SelectTrigger data-testid="select-owners">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Owner</SelectItem>
                      <SelectItem value="2">2nd Owner</SelectItem>
                      <SelectItem value="3">3rd Owner</SelectItem>
                      <SelectItem value="4">4+ Owners</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Mumbai"
                    required
                    data-testid="input-city"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Specific Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Andheri West"
                    required
                    data-testid="input-location"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details about condition, features, service history..."
                  rows={4}
                  data-testid="input-description"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createListingMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-listing"
                >
                  {createListingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Listing'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
