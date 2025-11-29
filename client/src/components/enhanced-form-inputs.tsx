/**
 * Enhanced form input components with improved validation feedback
 *
 * Features:
 * - Visual success/error states
 * - Animated borders and icons
 * - Accessibility improvements
 * - Better touch targets for mobile
 */

import { forwardRef, useState } from 'react';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  success?: boolean;
  label?: string;
  helperText?: string;
  showValidationIcon?: boolean;
}

/**
 * Enhanced input with validation states
 */
export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ error, success, label, helperText, showValidationIcon = true, className, ...props }, ref) => {
    const hasError = !!error;
    const showSuccess = success && !hasError && !props.disabled;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-2 transition-colors"
            style={{
              color: hasError ? 'var(--destructive)' : 'var(--foreground)',
            }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              "transition-all duration-200 pr-10",
              hasError && "border-red-500 focus-visible:ring-red-500",
              showSuccess && "border-green-500 focus-visible:ring-green-500",
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />

          {showValidationIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {hasError && (
                <AlertCircle className="w-5 h-5 text-red-500 animate-in fade-in zoom-in duration-200" />
              )}
              {showSuccess && (
                <Check className="w-5 h-5 text-green-500 animate-in fade-in zoom-in duration-200" />
              )}
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 duration-200"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            className="mt-2 text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

/**
 * Password input with show/hide toggle
 */
export const PasswordInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ error, success, label = "Password", showValidationIcon = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-2"
            style={{
              color: hasError ? 'var(--destructive)' : 'var(--foreground)',
            }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <Input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              "transition-all duration-200 pr-20",
              hasError && "border-red-500 focus-visible:ring-red-500",
              success && !hasError && "border-green-500 focus-visible:ring-green-500"
            )}
            aria-invalid={hasError}
            {...props}
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showValidationIcon && success && !hasError && (
              <Check className="w-5 h-5 text-green-500" />
            )}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              ) : (
                <Eye className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

/**
 * Number input with increment/decrement buttons
 */
export const NumberInput = forwardRef<HTMLInputElement, EnhancedInputProps & {
  min?: number;
  max?: number;
  step?: number;
}>(
  ({ error, success, label, min, max, step = 1, showValidationIcon = true, ...props }, ref) => {
    const hasError = !!error;

    const handleIncrement = () => {
      const input = ref as React.RefObject<HTMLInputElement>;
      if (input?.current) {
        const currentValue = parseFloat(input.current.value) || 0;
        const newValue = currentValue + step;
        if (max === undefined || newValue <= max) {
          input.current.value = newValue.toString();
          input.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    const handleDecrement = () => {
      const input = ref as React.RefObject<HTMLInputElement>;
      if (input?.current) {
        const currentValue = parseFloat(input.current.value) || 0;
        const newValue = currentValue - step;
        if (min === undefined || newValue >= min) {
          input.current.value = newValue.toString();
          input.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-2"
            style={{
              color: hasError ? 'var(--destructive)' : 'var(--foreground)',
            }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex">
          <button
            type="button"
            onClick={handleDecrement}
            className="px-3 border border-r-0 rounded-l-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Decrement"
          >
            −
          </button>

          <Input
            ref={ref}
            type="number"
            min={min}
            max={max}
            step={step}
            className={cn(
              "rounded-none border-x-0 text-center flex-1",
              hasError && "border-red-500",
              success && !hasError && "border-green-500"
            )}
            {...props}
          />

          <button
            type="button"
            onClick={handleIncrement}
            className="px-3 border border-l-0 rounded-r-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            style={{ borderColor: 'var(--border)' }}
            aria-label="Increment"
          >
            +
          </button>

          {showValidationIcon && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
              {hasError && <AlertCircle className="w-5 h-5 text-red-500" />}
              {success && !hasError && <Check className="w-5 h-5 text-green-500" />}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = 'NumberInput';

/**
 * Character count input
 */
export const TextAreaWithCount = forwardRef<HTMLTextAreaElement, {
  error?: string;
  success?: boolean;
  label?: string;
  maxLength?: number;
  className?: string;
  [key: string]: any;
}>(
  ({ error, success, label, maxLength, className, ...props }, ref) => {
    const [count, setCount] = useState(0);
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-2"
            style={{
              color: hasError ? 'var(--destructive)' : 'var(--foreground)',
            }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            maxLength={maxLength}
            className={cn(
              "w-full px-3 py-2 rounded-md border transition-all duration-200 resize-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              hasError && "border-red-500 focus-visible:ring-red-500",
              success && !hasError && "border-green-500 focus-visible:ring-green-500",
              className
            )}
            style={{
              backgroundColor: 'var(--input)',
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
            onChange={(e) => {
              setCount(e.target.value.length);
              props.onChange?.(e);
            }}
            {...props}
          />

          {maxLength && (
            <div
              className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--secondary-bg)',
                color: count > maxLength * 0.9 ? 'var(--destructive)' : 'var(--muted-foreground)',
              }}
            >
              {count}/{maxLength}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextAreaWithCount.displayName = 'TextAreaWithCount';
