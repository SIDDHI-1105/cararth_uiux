import { cn } from "@/lib/utils";
import cararthLogo from "@assets/generated_images/CarArth_logo_with_correct_branding_9738ebbe.png";

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
  // Responsive CSS classes controlling only height for proper aspect ratio
  const responsiveClasses = {
    header: "h-12 sm:h-14 md:h-16 w-auto max-w-full",
    hero: "h-16 sm:h-20 md:h-24 lg:h-28 w-auto max-w-full", 
    footer: "h-8 sm:h-10 md:h-12 w-auto max-w-full"
  };
  
  return (
    <img 
      src={cararthLogo}
      alt="CarArth - India's First Used Car Search Engine"
      className={cn("block object-contain", responsiveClasses[variant], className)}
      data-testid="caararth-logo"
    />
  );
}