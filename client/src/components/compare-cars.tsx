import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Check, Calendar, Gauge, Fuel, Settings, MapPin, User, Star } from "lucide-react";
import { type Car } from "@shared/schema";

interface CompareCarProps {
  selectedCars: string[];
  onRemoveCar: (carId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompareCars({ selectedCars, onRemoveCar, open, onOpenChange }: CompareCarProps) {
  const { data: cars = [] } = useQuery<Car[]>({
    queryKey: ['/api/cars'],
  });

  const compareCars = cars.filter(car => selectedCars.includes(car.id));

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(0)}k km`;
    }
    return `${mileage.toLocaleString()} km`;
  };

  const ComparisonRow = ({ label, getValue }: { label: string; getValue: (car: Car) => string }) => (
    <tr className="border-b border-border">
      <td className="p-3 font-medium text-muted-foreground bg-muted/50">{label}</td>
      {compareCars.map(car => (
        <td key={car.id} className="p-3 text-center">{getValue(car)}</td>
      ))}
    </tr>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Compare Cars ({compareCars.length}/3)
          </DialogTitle>
        </DialogHeader>

        {compareCars.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cars selected for comparison</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left bg-muted">Specification</th>
                  {compareCars.map(car => (
                    <th key={car.id} className="p-3 text-center bg-muted relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() => onRemoveCar(car.id)}
                        data-testid={`button-remove-compare-${car.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <img
                        src={(car.images && car.images[0]) || "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                        alt={car.title}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <div className="text-sm font-semibold">{car.title}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow 
                  label="Price" 
                  getValue={(car) => formatPrice(car.price)}
                />
                <ComparisonRow 
                  label="Year" 
                  getValue={(car) => car.year.toString()}
                />
                <ComparisonRow 
                  label="Mileage" 
                  getValue={(car) => formatMileage(car.mileage)}
                />
                <ComparisonRow 
                  label="Fuel Type" 
                  getValue={(car) => car.fuelType}
                />
                <ComparisonRow 
                  label="Transmission" 
                  getValue={(car) => car.transmission}
                />
                <ComparisonRow 
                  label="Owners" 
                  getValue={(car) => `${car.owners} owner${car.owners !== 1 ? 's' : ''}`}
                />
                <ComparisonRow 
                  label="Location" 
                  getValue={(car) => `${car.city}, ${car.state}`}
                />
                <ComparisonRow 
                  label="Verified" 
                  getValue={(car) => car.isVerified ? "✅ Yes" : "❌ No"}
                />
                <ComparisonRow 
                  label="Featured" 
                  getValue={(car) => car.isFeatured ? "⭐ Yes" : "No"}
                />
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <Button onClick={() => onOpenChange(false)} data-testid="button-close-compare">
            Close Comparison
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}