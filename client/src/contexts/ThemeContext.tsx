import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'day' | 'night';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // SSR-safe: default to 'day' until useEffect runs
  const [theme, setThemeState] = useState<Theme>('day');

  // Initialize theme from localStorage or system preference after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('cararth-theme');
    if (stored === 'day' || stored === 'night') {
      setThemeState(stored);
    } else {
      // Optionally respect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'night' : 'day');
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('day', 'night');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Persist to localStorage
    localStorage.setItem('cararth-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'day' ? 'night' : 'day');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return a fallback when ThemeProvider is not available
    return {
      theme: (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'night' : 'day') as Theme,
      toggleTheme: () => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark');
        }
      },
      setTheme: () => {}
    };
  }
  return context;
}
