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
  // Responsive CSS classes controlling only height for proper aspect ratio
  const responsiveClasses = {
    header: showTagline 
      ? "h-8 sm:h-10 md:h-11 w-auto max-w-full" 
      : "h-6 sm:h-7 md:h-8 w-auto max-w-full",
    hero: showTagline 
      ? "h-12 sm:h-14 md:h-16 lg:h-20 w-auto max-w-full" 
      : "h-10 sm:h-12 md:h-14 lg:h-16 w-auto max-w-full",
    footer: showTagline 
      ? "h-7 sm:h-8 md:h-9 w-auto max-w-full" 
      : "h-6 sm:h-7 md:h-8 w-auto max-w-full"
  };
  
  // Use consistent viewBox that scales properly
  const viewBoxWidth = 280;
  const viewBoxHeight = showTagline ? 80 : 56;
  
  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn("block", responsiveClasses[variant], className)}
      shapeRendering="geometricPrecision"
      style={{ vectorEffect: "non-scaling-stroke" }}
    >
      {/* CarArth wordmark with proper kerning */}
      <text
        x="0"
        y="36"
        fill="currentColor"
        fontSize="32"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        letterSpacing="-0.025em"
      >
        Car
        <tspan fill="#FF9933">A</tspan>
        rth
      </text>
      
      {/* Tagline with superscript asterisk */}
      {showTagline && (
        <text
          x="0"
          y="58"
          fill="currentColor"
          fontSize="12"
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="400"
          opacity="0.7"
        >
          India's first used car search engine
          <tspan
            fontSize="10"
            baselineShift="super"
          >
            *
          </tspan>
        </text>
      )}
    </svg>
  );
}