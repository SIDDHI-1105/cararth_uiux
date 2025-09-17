// Centralized constants for CarArth

// Default fallback image for car listings - simple geometric placeholder
export const FALLBACK_CAR_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f8fafc' stroke='%23e2e8f0' stroke-width='2' stroke-dasharray='5,5'/%3E%3Ctext x='200' y='130' text-anchor='middle' dy='0.3em' font-family='Arial, sans-serif' font-size='16' fill='%23475569'%3ENo Verified Photo%3C/text%3E%3Ctext x='200' y='160' text-anchor='middle' dy='0.3em' font-family='Arial, sans-serif' font-size='12' fill='%2364748b'%3EAuthentic photos not available%3C/text%3E%3Ctext x='200' y='185' text-anchor='middle' dy='0.3em' font-family='Arial, sans-serif' font-size='12' fill='%2364748b'%3EContact seller for more images%3C/text%3E%3C/svg%3E";

// Car image sizes for different components
export const CAR_IMAGE_SIZES = {
  card: "w=400&q=80",
  detail: "w=600&q=80", 
  modal: "w=800&q=80",
  thumbnail: "w=150&q=80"
} as const;