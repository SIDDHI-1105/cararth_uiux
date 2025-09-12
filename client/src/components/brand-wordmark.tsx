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
  // Use clamp-based sizing for better responsive scaling
  const sizeStyles = {
    header: { height: 'clamp(60px, 8vw, 100px)' },
    hero: { height: 'clamp(80px, 12vw, 140px)' }, 
    footer: { height: 'clamp(40px, 6vw, 80px)' }
  };
  
  return (
    <img 
      src={cararthLogo}
      alt="CarArth - India's First Used Car Search Engine"
      className={cn("block object-contain drop-shadow-md dark:drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] w-auto max-w-full", className)}
      style={sizeStyles[variant]}
      fetchpriority="high"
      loading="eager"
      data-testid="caararth-logo"
    />
  );
}