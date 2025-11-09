import { cn } from "@/lib/utils";
import cararthLogo from "@assets/cararth-logo.png";
import cararthLogoFull from "@assets/cararth-logo-full.png";

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
  // Logo sizes for each variant - PREMIUM, BOLD & HIGHLY VISIBLE
  const logoSizes = {
    header: "h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36",
    hero: "h-40 sm:h-48 md:h-56 lg:h-64 xl:h-72", 
    footer: "h-16 sm:h-20 md:h-24"
  };
  
  const taglineSizes = {
    header: "text-base sm:text-lg md:text-xl",
    hero: "text-xl sm:text-2xl md:text-3xl lg:text-4xl", 
    footer: "text-sm sm:text-base md:text-lg"
  };
  
  // Use full logo (with www.cararth.com) for hero and footer
  // Use cropped logo (cleaner) for header
  const logoSrc = variant === "hero" || variant === "footer" ? cararthLogoFull : cararthLogo;
  
  return (
    <div className={cn("flex flex-col items-start", className)} data-testid="cararth-logo">
      {/* CarArth Logo Image */}
      <div className="flex items-center">
        <img 
          src={logoSrc} 
          alt="CarArth - India's very own used car search engine"
          className={cn(
            "object-contain transition-all duration-300 hover:scale-110",
            logoSizes[variant]
          )}
          style={{
            filter: "drop-shadow(3px 5px 12px rgba(0,0,0,0.2))"
          }}
        />
      </div>
      
      {/* Tagline - hide for hero since new logo includes branding */}
      {showTagline && variant === "header" && (
        <div className={cn("font-bold text-gray-800 dark:text-gray-200 mt-2", taglineSizes[variant])}>
          India's very own used car search engine
          <span className="text-primary font-semibold">*</span>
        </div>
      )}
    </div>
  );
}
