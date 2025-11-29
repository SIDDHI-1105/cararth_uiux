/**
 * Animated button component with micro-interactions
 *
 * Features:
 * - Loading states with spinners
 * - Success/error animations
 * - Ripple effect on click
 * - Smooth transitions
 * - Haptic-like feedback animations
 */

import { forwardRef, useState, ButtonHTMLAttributes } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      success = false,
      error = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;

      // Create ripple effect
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      onClick?.(e);
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-lg',
    };

    const variantStyles = {
      primary: {
        backgroundColor: 'var(--primary)',
        color: 'var(--primary-foreground)',
        hover: 'hover:opacity-90',
      },
      secondary: {
        backgroundColor: 'var(--secondary-bg)',
        color: 'var(--foreground)',
        hover: 'hover:opacity-80',
      },
      outline: {
        backgroundColor: 'transparent',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--foreground)',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
      },
      destructive: {
        backgroundColor: 'var(--destructive)',
        color: 'white',
        hover: 'hover:opacity-90',
      },
    };

    const currentVariant = variantStyles[variant];

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-medium rounded-lg',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',
          'overflow-hidden',
          sizeClasses[size],
          currentVariant.hover,
          fullWidth && 'w-full',
          className
        )}
        style={{
          backgroundColor: currentVariant.backgroundColor,
          color: currentVariant.color,
          border: currentVariant.border,
        }}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effect */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Loading state */}
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {/* Success state */}
        {success && !loading && (
          <Check className="w-4 h-4 animate-in zoom-in duration-200" />
        )}

        {/* Error state */}
        {error && !loading && !success && (
          <AlertCircle className="w-4 h-4 animate-in zoom-in duration-200" />
        )}

        {/* Icon */}
        {!loading && !success && !error && icon && iconPosition === 'left' && (
          <span className="transition-transform group-hover:scale-110">{icon}</span>
        )}

        {/* Children */}
        {!loading && (
          <span className={cn(
            "transition-all duration-200",
            (success || error) && "opacity-0 w-0"
          )}>
            {children}
          </span>
        )}

        {/* Icon right */}
        {!loading && !success && !error && icon && iconPosition === 'right' && (
          <span className="transition-transform group-hover:scale-110">{icon}</span>
        )}

        {/* Success text */}
        {success && !loading && (
          <span className="animate-in slide-in-from-right duration-200">
            {typeof children === 'string' ? 'Success!' : children}
          </span>
        )}

        {/* Error text */}
        {error && !loading && !success && (
          <span className="animate-in slide-in-from-right duration-200">
            {typeof children === 'string' ? 'Error' : children}
          </span>
        )}
      </button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

/**
 * Floating Action Button (FAB)
 */
export const FAB = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <AnimatedButton
        ref={ref}
        className={cn(
          'fixed bottom-6 right-6 rounded-full shadow-lg',
          'hover:shadow-xl hover:scale-110',
          'w-14 h-14 p-0',
          'z-50',
          className
        )}
        {...props}
      >
        {children}
      </AnimatedButton>
    );
  }
);

FAB.displayName = 'FAB';

/**
 * Icon Button with tooltip
 */
export const IconButton = forwardRef<HTMLButtonElement, AnimatedButtonProps & {
  tooltip?: string;
}>(
  ({ children, tooltip, className, ...props }, ref) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <div className="relative inline-block">
        <AnimatedButton
          ref={ref}
          variant="ghost"
          size="sm"
          className={cn('p-2 rounded-full', className)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          {...props}
        >
          {children}
        </AnimatedButton>

        {tooltip && showTooltip && (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200"
            style={{
              backgroundColor: 'var(--foreground)',
              color: 'var(--background)',
            }}
          >
            {tooltip}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '4px solid var(--foreground)',
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

IconButton.displayName = 'IconButton';
