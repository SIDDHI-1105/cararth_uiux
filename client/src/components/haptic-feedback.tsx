import React, { useCallback } from 'react';

interface HapticFeedbackOptions {
  enabled?: boolean;
}

interface HapticPatterns {
  button: number[];
  success: number[];
  error: number[];
  notification: number[];
  selection: number[];
  navigation: number[];
}

/**
 * Haptic Feedback Hook for Mobile and Desktop
 * Mobile: Uses Vibration API
 * Desktop: Uses audio feedback and enhanced visual cues
 */
export function useHapticFeedback(options: HapticFeedbackOptions = {}) {
  const { enabled = true } = options;

  // Define haptic patterns
  const patterns: HapticPatterns = {
    button: [25],           // Quick tap for buttons
    success: [100, 50, 100], // Double pulse for success
    error: [200, 100, 200, 100, 200], // Triple pulse for errors
    notification: [50],     // Single pulse for notifications
    selection: [10],        // Very light for selections
    navigation: [15],       // Light for navigation
  };

  // Check for vibration support
  const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  // Audio feedback for desktop (when vibration unavailable)
  const playAudioFeedback = useCallback((type: keyof HapticPatterns) => {
    if (hasVibration) return; // Skip audio if vibration available

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different feedback types
      const frequencies = {
        button: 800,
        success: 1200,
        error: 400,
        notification: 1000,
        selection: 1500,
        navigation: 900,
      };

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Silently fail if audio context unavailable
    }
  }, [hasVibration]);

  // Main haptic feedback function
  const triggerHaptic = useCallback((type: keyof HapticPatterns) => {
    if (!enabled) return;

    const pattern = patterns[type];

    if (hasVibration) {
      // Mobile: Use vibration
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Fallback to audio if vibration fails
        playAudioFeedback(type);
      }
    } else {
      // Desktop: Use audio feedback
      playAudioFeedback(type);
    }
  }, [enabled, hasVibration, playAudioFeedback, patterns]);

  // Convenience methods for different interaction types
  const feedback = {
    button: () => triggerHaptic('button'),
    success: () => triggerHaptic('success'),
    error: () => triggerHaptic('error'),
    notification: () => triggerHaptic('notification'),
    selection: () => triggerHaptic('selection'),
    navigation: () => triggerHaptic('navigation'),
  };

  return {
    triggerHaptic,
    feedback,
    hasVibration,
    isEnabled: enabled,
  };
}

/**
 * Enhanced Button Component with Haptic Feedback
 */
interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  hapticType?: keyof HapticPatterns;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function HapticButton({ 
  children, 
  hapticType = 'button', 
  variant = 'primary',
  size = 'md',
  onClick, 
  className = '',
  ...props 
}: HapticButtonProps) {
  const { feedback } = useHapticFeedback();

  const baseClasses = 'font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
    ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-accent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    feedback[hapticType]();
    onClick?.(e);
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Enhanced Select Component with Haptic Feedback
 */
interface HapticSelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  value?: string;
  placeholder?: string;
}

export function HapticSelect({ children, onValueChange, ...props }: HapticSelectProps) {
  const { feedback } = useHapticFeedback();

  const handleValueChange = (value: string) => {
    feedback.selection();
    onValueChange?.(value);
  };

  return (
    <div className="relative">
      <select
        onChange={(e) => handleValueChange(e.target.value)}
        className="w-full px-3 py-2 text-base border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary min-h-[44px] appearance-none"
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

/**
 * Haptic Context Provider for Global Settings
 */
import { createContext, useContext, useState, useEffect } from 'react';

interface HapticContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

const HapticContext = createContext<HapticContextType | undefined>(undefined);

export function HapticProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('haptic-enabled');
      return stored !== 'false';
    }
    return true;
  });

  React.useEffect(() => {
    localStorage.setItem('haptic-enabled', enabled.toString());
  }, [enabled]);

  return (
    <HapticContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </HapticContext.Provider>
  );
}

export function useHapticContext() {
  const context = useContext(HapticContext);
  if (!context) {
    throw new Error('useHapticContext must be used within HapticProvider');
  }
  return context;
}