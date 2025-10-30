import { useQuery } from "@tanstack/react-query";
import { ListingCard } from "@/components/listing-card";
import { SkeletonCard } from "@/components/skeleton-card";

interface RelatedListingsProps {
  currentCarId: string;
  brand?: string;
  city?: string;
  priceRange?: { min: number; max: number };
}

export function RelatedListings({ currentCarId, brand, city, priceRange }: RelatedListingsProps) {
  const { data: relatedCars = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/marketplace/search", { brand, city, limit: 4 }],
    select: (data: any) => {
      const listings = Array.isArray(data) ? data : data.listings || [];
      return listings
        .filter((car: any) => car.id !== currentCarId)
        .slice(0, 4);
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30" data-testid="section-related-listings">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Similar Cars You Might Like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (relatedCars.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30" data-testid="section-related-listings">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Similar Cars You Might Like</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedCars.map((car) => (
            <ListingCard
              key={car.id}
              id={car.id}
              image={car.images?.[0] || car.imageUrl || "https://placehold.co/400x300/e5e7eb/6b7280?text=No+Image"}
              title={car.title || `${car.make} ${car.model} ${car.year}`}
              price={parseFloat(car.price)}
              year={car.year}
              mileage={car.mileage || car.kmDriven}
              fuelType={car.fuelType || "Petrol"}
              transmission={car.transmission || "Manual"}
              city={car.city || car.location || "India"}
              isVerified={car.verificationStatus === "approved" || car.isVerified}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
