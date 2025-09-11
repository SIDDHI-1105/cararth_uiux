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
  // Size presets based on variant
  const sizes = {
    header: { width: 140, height: showTagline ? 40 : 28 },
    hero: { width: 280, height: showTagline ? 80 : 56 },
    footer: { width: 120, height: showTagline ? 36 : 24 }
  };
  
  const size = sizes[variant];
  
  return (
    <svg
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      className={cn("block", className)}
      shapeRendering="geometricPrecision"
      style={{ vectorEffect: "non-scaling-stroke" }}
    >
      {/* CarArth wordmark with proper kerning */}
      <text
        x="0"
        y={showTagline ? "20" : "18"}
        fill="currentColor"
        fontSize={variant === "hero" ? "24" : variant === "header" ? "20" : "16"}
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
          y={variant === "hero" ? "36" : variant === "header" ? "32" : "28"}
          fill="currentColor"
          fontSize={variant === "hero" ? "10" : variant === "header" ? "9" : "8"}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight="400"
          opacity="0.7"
        >
          India's first used car search engine
          <tspan
            fontSize={variant === "hero" ? "8" : variant === "header" ? "7" : "6"}
            baselineShift="super"
          >
            *
          </tspan>
        </text>
      )}
    </svg>
  );
}