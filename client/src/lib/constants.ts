// Centralized constants for CarArth

// Default fallback image for car listings (generic car silhouette, not a specific luxury car)
export const FALLBACK_CAR_IMAGE_URL = "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=80";

// Car image sizes for different components
export const CAR_IMAGE_SIZES = {
  card: "w=400&q=80",
  detail: "w=600&q=80", 
  modal: "w=800&q=80",
  thumbnail: "w=150&q=80"
} as const;