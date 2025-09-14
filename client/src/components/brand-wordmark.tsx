import { cn } from "@/lib/utils";
import cararthLogo from "@assets/cararth logo_1757827558983.png";

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
  // Logo sizes for each variant
  const logoSizes = {
    header: "h-12 sm:h-16 md:h-20 lg:h-24",
    hero: "h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56", 
    footer: "h-10 sm:h-12 md:h-16"
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
          alt="CarArth - India's first used car search engine"
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
          India's first used car search engine
          <span className="text-primary font-semibold">*</span>
        </div>
      )}
    </div>
  );
}