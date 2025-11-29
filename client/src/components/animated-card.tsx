/**
 * Animated card components with micro-interactions
 *
 * Features:
 * - Smooth hover effects
 * - Scale and shadow transitions
 * - Glow effects
 * - Tilt on hover (optional)
 * - Click animations
 */

import { forwardRef, useState, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverScale?: boolean;
  hoverGlow?: boolean;
  hoverTilt?: boolean;
  clickable?: boolean;
  glassmorphic?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      children,
      hoverScale = true,
      hoverGlow = false,
      hoverTilt = false,
      clickable = false,
      glassmorphic = true,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!hoverTilt) return;

      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const tiltX = ((y - centerY) / centerY) * -10;
      const tiltY = ((x - centerX) / centerX) * 10;

      setTilt({ x: tiltX, y: tiltY });
    };

    const handleMouseLeave = () => {
      if (hoverTilt) {
        setTilt({ x: 0, y: 0 });
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-lg overflow-hidden',
          'transition-all duration-300 ease-out',
          glassmorphic && 'glass-card',
          hoverScale && 'hover:scale-[1.02]',
          hoverGlow && 'hover:shadow-glow',
          clickable && 'cursor-pointer active:scale-[0.98]',
          className
        )}
        style={{
          transform: hoverTilt
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            : undefined,
          transition: 'all 0.3s ease-out',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        {...props}
      >
        {/* Gradient overlay on hover */}
        {hoverGlow && (
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(0,113,227,0.1) 0%, transparent 70%)',
            }}
          />
        )}

        {children}
      </div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

/**
 * Feature card with icon animation
 */
export const FeatureCard = forwardRef<HTMLDivElement, {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}>(
  ({ icon, title, description, className, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <AnimatedCard
        ref={ref}
        className={cn('p-6', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              'mb-4 transition-all duration-300',
              isHovered && 'scale-110 rotate-3'
            )}
            style={{ color: 'var(--primary)' }}
          >
            {icon}
          </div>
        )}

        <h3
          className="text-xl font-semibold mb-2 transition-colors duration-300"
          style={{ color: isHovered ? 'var(--primary)' : 'var(--foreground)' }}
        >
          {title}
        </h3>

        <p
          className="text-sm"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {description}
        </p>
      </AnimatedCard>
    );
  }
);

FeatureCard.displayName = 'FeatureCard';

/**
 * Car listing card with image and details
 */
export const CarCard = forwardRef<HTMLDivElement, {
  image?: string;
  title: string;
  price: number;
  year?: number;
  mileage?: number;
  location?: string;
  onClick?: () => void;
  className?: string;
}>(
  ({ image, title, price, year, mileage, location, onClick, className, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
      <AnimatedCard
        ref={ref}
        clickable
        hoverGlow
        className={cn('overflow-hidden', className)}
        onClick={onClick}
        {...props}
      >
        {/* Image */}
        <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {image && (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-gray-700" />
              )}
              <img
                src={image}
                alt={title}
                className={cn(
                  'w-full h-full object-cover transition-all duration-500',
                  'group-hover:scale-110',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3
            className="text-lg font-semibold line-clamp-2"
            style={{ color: 'var(--foreground)' }}
          >
            {title}
          </h3>

          <div className="flex items-center justify-between">
            <span
              className="text-2xl font-bold"
              style={{ color: 'var(--primary)' }}
            >
              ₹{price.toLocaleString()}
            </span>

            {year && (
              <span
                className="text-sm px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--secondary-bg)',
                  color: 'var(--muted-foreground)',
                }}
              >
                {year}
              </span>
            )}
          </div>

          {(mileage || location) && (
            <div
              className="flex items-center gap-3 text-sm"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {mileage && <span>{mileage.toLocaleString()} km</span>}
              {mileage && location && <span>•</span>}
              {location && <span>{location}</span>}
            </div>
          )}
        </div>
      </AnimatedCard>
    );
  }
);

CarCard.displayName = 'CarCard';

/**
 * Stat card with animated number
 */
export const StatCard = forwardRef<HTMLDivElement, {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}>(
  ({ label, value, icon, trend, trendValue, className, ...props }, ref) => {
    const trendColors = {
      up: 'text-green-500',
      down: 'text-red-500',
      neutral: 'text-gray-500',
    };

    return (
      <AnimatedCard
        ref={ref}
        hoverScale
        className={cn('p-6', className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p
              className="text-sm font-medium mb-2"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {label}
            </p>

            <p
              className="text-3xl font-bold mb-1"
              style={{ color: 'var(--foreground)' }}
            >
              {value}
            </p>

            {trend && trendValue && (
              <p className={cn('text-sm font-medium', trendColors[trend])}>
                {trendValue}
              </p>
            )}
          </div>

          {icon && (
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: 'var(--secondary-bg)' }}
            >
              {icon}
            </div>
          )}
        </div>
      </AnimatedCard>
    );
  }
);

StatCard.displayName = 'StatCard';
