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
        <span className="text-gray-300 dark:text-gray-400 relative" style={{
          textShadow: '2px 2px 0px #666, 4px 4px 0px #333, 6px 6px 8px rgba(0,0,0,0.4), 0px 0px 12px rgba(255,255,255,0.2)',
          transform: 'translateZ(0)',
          filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))'
        }}>
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