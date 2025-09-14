// Centralized constants for CarArth

// Default fallback image for car listings
export const FALLBACK_CAR_IMAGE_URL = "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80";

// Car image sizes for different components
export const CAR_IMAGE_SIZES = {
  card: "w=400&q=80",
  detail: "w=600&q=80", 
  modal: "w=800&q=80",
  thumbnail: "w=150&q=80"
} as const;