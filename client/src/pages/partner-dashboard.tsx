import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Plus, Edit, Trash2, Car } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PartnerDashboard() {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
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
      const response = await apiRequest('/api/partner/listings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
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
      const response = await apiRequest(`/api/partner/listings/${id}`, {
        method: 'DELETE'
      });
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

  const listings = listingsData?.listings || [];

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
                {accountData?.source?.name || 'CarArth Partner'}
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

        <Card className="p-6 mb-8">
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
