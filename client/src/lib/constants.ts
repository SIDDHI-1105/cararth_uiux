// Centralized constants for CarArth

// Default fallback image for car listings - simple geometric placeholder
export const FALLBACK_CAR_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='0.3em' font-family='Arial, sans-serif' font-size='18' fill='%23374151'%3ENo Image Available%3C/text%3E%3C/svg%3E";

// Car image sizes for different components
export const CAR_IMAGE_SIZES = {
  card: "w=400&q=80",
  detail: "w=600&q=80", 
  modal: "w=800&q=80",
  thumbnail: "w=150&q=80"
} as const;