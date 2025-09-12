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
      <div className={cn("font-bold tracking-tight leading-none", textSizes[variant])}>
        <span className="text-foreground">Car</span>
        <span className="text-orange-500">A</span>
        <span className="text-foreground">rth</span>
      </div>
      
      {/* Tagline */}
      {showTagline && (
        <div className={cn("font-medium text-muted-foreground mt-1", taglineSizes[variant])}>
          India's first used car search engine
          <span className="text-orange-500 font-semibold">*</span>
        </div>
      )}
    </div>
  );
}