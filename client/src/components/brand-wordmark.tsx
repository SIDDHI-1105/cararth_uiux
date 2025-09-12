import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  variant?: "header" | "hero" | "footer";
  showTagline?: boolean;
  className?: string;
}

export function BrandWordmark({ 
  variant = "header", 
  showTagline = true, 
  className 
}: BrandWordmarkProps) {
  // Large, visible text sizes for each variant
  const textSizes = {
    header: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl",
    hero: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl", 
    footer: "text-xl sm:text-2xl md:text-3xl"
  };
  
  const taglineSizes = {
    header: "text-sm sm:text-base md:text-lg",
    hero: "text-lg sm:text-xl md:text-2xl lg:text-3xl", 
    footer: "text-xs sm:text-sm md:text-base"
  };
  
  return (
    <div className={cn("flex flex-col", className)} data-testid="caararth-logo">
      {/* Main CarArth wordmark */}
      <div className={cn("font-bold tracking-tight leading-none relative", textSizes[variant])}>
        <span className="text-orange-600">Car</span>
        <span className="text-orange-500">A</span>
        <span className="text-gray-300 dark:text-gray-400 relative bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 px-1 rounded-sm shadow-sm" style={{textShadow: '0 0 8px rgba(192, 192, 192, 0.6)'}}>
          <span className="absolute top-1/4 left-0 right-0 h-0.5 bg-navy-600" style={{backgroundColor: '#1e40af'}}></span>
          rth
        </span>
        <span className="text-green-600">.com</span>
      </div>
      
      {/* Tagline */}
      {showTagline && (
        <div className={cn("font-bold text-gray-800 dark:text-gray-200 mt-1", taglineSizes[variant])}>
          India's first used car search engine
          <span className="text-black dark:text-white font-semibold">*</span>
        </div>
      )}
    </div>
  );
}