import { cn } from "@/lib/utils";
import cararthLogo from "@assets/cararth-logo.png";

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
  // Logo sizes for each variant - LARGER & MORE VISIBLE
  const logoSizes = {
    header: "h-16 sm:h-20 md:h-24 lg:h-28",
    hero: "h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64", 
    footer: "h-12 sm:h-16 md:h-20"
  };
  
  const taglineSizes = {
    header: "text-sm sm:text-base md:text-lg",
    hero: "text-lg sm:text-xl md:text-2xl lg:text-3xl", 
    footer: "text-xs sm:text-sm md:text-base"
  };
  
  return (
    <div className={cn("flex flex-col items-start", className)} data-testid="cararth-logo">
      {/* CarArth Logo Image */}
      <div className="flex items-center">
        <img 
          src={cararthLogo} 
          alt="CarArth - India's own used car search engine"
          className={cn(
            "object-contain transition-transform duration-300 hover:scale-105",
            logoSizes[variant]
          )}
          style={{
            filter: "drop-shadow(2px 4px 8px rgba(0,0,0,0.15))"
          }}
        />
      </div>
      
      {/* Tagline (only show if explicitly requested and not already in logo) */}
      {showTagline && variant !== "hero" && (
        <div className={cn("font-bold text-gray-800 dark:text-gray-200 mt-2", taglineSizes[variant])}>
          India's own used car search engine
          <span className="text-primary font-semibold">*</span>
        </div>
      )}
    </div>
  );
}