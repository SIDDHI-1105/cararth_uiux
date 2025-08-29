import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CarCard from "@/components/car-card";
import { type Car } from "@shared/schema";
import { Clock } from "lucide-react";

export default function RecentlyViewed() {
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const viewedCars = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewedIds(viewedCars);
  }, []);

  const { data: cars = [], isLoading } = useQuery<Car[]>({
    queryKey: ['/api/cars'],
    enabled: recentlyViewedIds.length > 0,
  });

  const recentlyViewedCars = cars.filter(car => 
    recentlyViewedIds.includes(car.id)
  ).sort((a, b) => 
    recentlyViewedIds.indexOf(a.id) - recentlyViewedIds.indexOf(b.id)
  );

  if (recentlyViewedIds.length === 0 || recentlyViewedCars.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Clock className="w-6 h-6 text-accent mr-2" />
        <h2 className="text-2xl font-bold">Recently Viewed Cars</h2>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyViewedCars.slice(0, 6).map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </section>
  );
}