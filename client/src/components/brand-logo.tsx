import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "header" | "footer" | "hero";
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({ variant = "header", showTagline = true, className }: BrandLogoProps) {
  const getWordmarkSize = () => {
    switch (variant) {
      case "hero":
        return "text-3xl sm:text-4xl lg:text-5xl";
      case "footer":
        return "text-xl sm:text-2xl";
      default: // header
        return "text-xl sm:text-2xl lg:text-3xl";
    }
  };

  const getTaglineSize = () => {
    switch (variant) {
      case "hero":
        return "text-sm sm:text-base";
      default:
        return "text-xs sm:text-sm";
    }
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 bg-background/90 dark:bg-background/80 backdrop-blur-sm ring-1 ring-border/50 rounded-lg shadow-sm",
        className
      )}
      data-testid="brand-logo"
    >
      <div className="flex flex-col">
        {/* CarArth Wordmark */}
        <div className={cn(
          "font-extrabold tracking-tight text-foreground drop-shadow-sm flex items-baseline",
          getWordmarkSize()
        )}>
          <span data-testid="text-car">Car</span>
          <span 
            className="text-[hsl(var(--saffron))] dark:text-[hsl(var(--saffron))]" 
            data-testid="text-a"
          >
            A
          </span>
          <span data-testid="text-rth">rth</span>
        </div>
        
        {/* Tagline */}
        {showTagline && (
          <div 
            className={cn(
              "text-muted-foreground/80 font-medium whitespace-nowrap",
              getTaglineSize(),
              variant === "header" ? "hidden md:block" : ""
            )}
            data-testid="text-tagline"
          >
            India's first used car search engine*
          </div>
        )}
      </div>
    </div>
  );
}